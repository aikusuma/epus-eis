-- ClickHouse initialization script
-- Create database
CREATE DATABASE IF NOT EXISTS epus_analytics;

-- Dimension: Wilayah (Kecamatan)
CREATE TABLE IF NOT EXISTS epus_analytics.dim_wilayah (
    wilayah_id String,
    kode_kecamatan String,
    nama_kecamatan String,
    kode_kabupaten String,
    nama_kabupaten String DEFAULT 'Brebes',
    created_at DateTime DEFAULT now()
) ENGINE = ReplacingMergeTree()
ORDER BY wilayah_id;

-- Dimension: Puskesmas
CREATE TABLE IF NOT EXISTS epus_analytics.dim_puskesmas (
    puskesmas_id String,
    kode_puskesmas String,
    nama_puskesmas String,
    wilayah_id String,
    alamat String,
    telepon String,
    jenis String, -- 'rawat_inap', 'non_rawat_inap'
    status String DEFAULT 'aktif',
    created_at DateTime DEFAULT now()
) ENGINE = ReplacingMergeTree()
ORDER BY puskesmas_id;

-- Dimension: ICD-10
CREATE TABLE IF NOT EXISTS epus_analytics.dim_icd10 (
    icd10_code String,
    icd10_name String,
    icd10_group String, -- 'ISPA', 'Pneumonia', 'Hipertensi', etc.
    kategori_program String, -- 'PTM', 'menular', 'KIA', 'umum'
    chapter String, -- ICD-10 chapter (I-XXII)
    block_range String,
    created_at DateTime DEFAULT now()
) ENGINE = ReplacingMergeTree()
ORDER BY icd10_code;

-- Dimension: Time (pre-populated calendar)
CREATE TABLE IF NOT EXISTS epus_analytics.dim_time (
    date Date,
    year UInt16,
    month UInt8,
    day UInt8,
    quarter UInt8,
    week_of_year UInt8,
    day_of_week UInt8,
    day_name String,
    month_name String,
    is_weekend UInt8
) ENGINE = ReplacingMergeTree()
ORDER BY date;

-- Fact Table: Diagnosis (main analytics table)
CREATE TABLE IF NOT EXISTS epus_analytics.fact_diagnosis (
    id UUID DEFAULT generateUUIDv4(),
    date Date,
    wilayah_id String,
    puskesmas_id String,
    layanan_type String, -- 'RJ' (Rawat Jalan), 'UGD', 'RI' (Rawat Inap)
    unit_type String, -- 'Puskesmas', 'Pustu', 'Posyandu', 'Polindes'
    icd10_code String,
    gender String, -- 'L', 'P'
    age_group String, -- 'bayi', 'anak', 'remaja', 'dewasa', 'lansia'
    visit_count UInt32 DEFAULT 1,
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, wilayah_id, puskesmas_id, icd10_code, layanan_type, unit_type, gender, age_group)
SETTINGS index_granularity = 8192;

-- Fact Table: Kunjungan (visit aggregates)
CREATE TABLE IF NOT EXISTS epus_analytics.fact_kunjungan (
    id UUID DEFAULT generateUUIDv4(),
    date Date,
    wilayah_id String,
    puskesmas_id String,
    layanan_type String,
    unit_type String,
    gender String,
    age_group String,
    total_kunjungan UInt32 DEFAULT 1,
    kunjungan_baru UInt32 DEFAULT 0,
    kunjungan_lama UInt32 DEFAULT 0,
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, wilayah_id, puskesmas_id, layanan_type, unit_type)
SETTINGS index_granularity = 8192;

-- Fact Table: Program-specific (PTM, KIA, etc.)
CREATE TABLE IF NOT EXISTS epus_analytics.fact_program (
    id UUID DEFAULT generateUUIDv4(),
    date Date,
    wilayah_id String,
    puskesmas_id String,
    program_type String, -- 'PTM', 'KIA', 'IMUNISASI', 'GIZI', 'TB', 'KESLING'
    indicator_code String,
    indicator_name String,
    target_value Float64 DEFAULT 0,
    achievement_value Float64 DEFAULT 0,
    gender String,
    age_group String,
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, wilayah_id, puskesmas_id, program_type, indicator_code)
SETTINGS index_granularity = 8192;

-- Materialized View: Daily diagnosis summary
CREATE MATERIALIZED VIEW IF NOT EXISTS epus_analytics.mv_daily_diagnosis_summary
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, wilayah_id, puskesmas_id, icd10_code)
AS SELECT
    date,
    wilayah_id,
    puskesmas_id,
    icd10_code,
    sum(visit_count) as total_visits,
    countIf(gender = 'L') as male_count,
    countIf(gender = 'P') as female_count,
    countIf(age_group = 'bayi') as bayi_count,
    countIf(age_group = 'anak') as anak_count,
    countIf(age_group = 'remaja') as remaja_count,
    countIf(age_group = 'dewasa') as dewasa_count,
    countIf(age_group = 'lansia') as lansia_count
FROM epus_analytics.fact_diagnosis
GROUP BY date, wilayah_id, puskesmas_id, icd10_code;

-- Materialized View: Monthly puskesmas summary
CREATE MATERIALIZED VIEW IF NOT EXISTS epus_analytics.mv_monthly_puskesmas_summary
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(month_date)
ORDER BY (month_date, puskesmas_id)
AS SELECT
    toStartOfMonth(date) as month_date,
    puskesmas_id,
    sum(visit_count) as total_visits,
    uniqExact(icd10_code) as unique_diagnoses
FROM epus_analytics.fact_diagnosis
GROUP BY month_date, puskesmas_id;

-- Insert initial time dimension data (2024-2030)
INSERT INTO epus_analytics.dim_time
SELECT
    date,
    toYear(date) as year,
    toMonth(date) as month,
    toDayOfMonth(date) as day,
    toQuarter(date) as quarter,
    toWeek(date) as week_of_year,
    toDayOfWeek(date) as day_of_week,
    dateName('weekday', date) as day_name,
    dateName('month', date) as month_name,
    if(toDayOfWeek(date) >= 6, 1, 0) as is_weekend
FROM (
    SELECT toDate('2024-01-01') + number as date
    FROM numbers(2557) -- ~7 years
);
