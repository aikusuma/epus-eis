import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  IconVirus,
  IconHeartbeat,
  IconTemperature,
  IconLungs,
  IconDroplet
} from '@tabler/icons-react';

const topPenyakit = [
  {
    code: 'J06.9',
    name: 'ISPA (Infeksi Saluran Pernapasan Akut)',
    icon: IconLungs,
    count: 8234,
    trend: 'down',
    percent: '-5.2%',
    kategori: 'menular'
  },
  {
    code: 'I10',
    name: 'Hipertensi Primer (Esensial)',
    icon: IconHeartbeat,
    count: 6512,
    trend: 'up',
    percent: '+8.3%',
    kategori: 'PTM'
  },
  {
    code: 'E11.9',
    name: 'Diabetes Melitus Tipe 2',
    icon: IconDroplet,
    count: 4128,
    trend: 'up',
    percent: '+3.1%',
    kategori: 'PTM'
  },
  {
    code: 'K29.7',
    name: 'Gastritis',
    icon: IconVirus,
    count: 3845,
    trend: 'stable',
    percent: '+0.5%',
    kategori: 'umum'
  },
  {
    code: 'R50.9',
    name: 'Demam, Tidak Spesifik',
    icon: IconTemperature,
    count: 2956,
    trend: 'down',
    percent: '-2.1%',
    kategori: 'umum'
  }
];

export function RecentSales() {
  return (
    <Card className='h-full'>
      <CardHeader className='pb-2'>
        <CardTitle className='text-base'>Top 5 Penyakit</CardTitle>
        <CardDescription className='text-xs'>
          Berdasarkan jumlah kunjungan bulan ini
        </CardDescription>
      </CardHeader>
      <CardContent className='pt-0'>
        <div className='space-y-3'>
          {topPenyakit.map((penyakit, index) => {
            const Icon = penyakit.icon;
            return (
              <div key={index} className='flex items-center gap-2'>
                <div className='bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-full'>
                  <Icon className='h-3.5 w-3.5' />
                </div>
                <div className='min-w-0 flex-1 space-y-0.5'>
                  <p className='truncate text-xs leading-none font-medium'>
                    {penyakit.name}
                  </p>
                  <p className='text-muted-foreground text-[10px]'>
                    {penyakit.code}
                  </p>
                </div>
                <div className='flex flex-col items-end gap-0.5'>
                  <span className='text-sm font-semibold tabular-nums'>
                    {penyakit.count.toLocaleString('id-ID')}
                  </span>
                  <Badge
                    variant={
                      penyakit.trend === 'up'
                        ? 'destructive'
                        : penyakit.trend === 'down'
                          ? 'secondary'
                          : 'outline'
                    }
                    className='px-1 py-0 text-[10px]'
                  >
                    {penyakit.percent}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
