'use client';

import { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import {
  IconCalendar,
  IconBuilding,
  IconCheck,
  IconChevronDown,
  IconRefresh
} from '@tabler/icons-react';

export interface FilterValues {
  dateRange: DateRange | undefined;
  puskesmasId: string;
  jenisLayanan: string;
}

interface Puskesmas {
  id: string;
  kodePuskesmas: string;
  namaPuskesmas: string;
  jenis: string;
}

interface DashboardFilterProps {
  onFilterChange?: (filters: FilterValues) => void;
  showJenisLayanan?: boolean;
  className?: string;
}

const JENIS_LAYANAN_OPTIONS = [
  { value: 'all', label: 'Semua Layanan' },
  { value: 'puskesmas', label: 'Puskesmas' },
  { value: 'pustu', label: 'Pustu' },
  { value: 'posyandu', label: 'Posyandu' }
];

export function DashboardFilter({
  onFilterChange,
  showJenisLayanan = true,
  className = ''
}: DashboardFilterProps) {
  const [puskesmasList, setPuskesmasList] = useState<Puskesmas[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [puskesmasPopoverOpen, setPuskesmasPopoverOpen] = useState(false);

  // Default to current month range
  const currentDate = new Date();
  const defaultRange: DateRange = {
    from: startOfMonth(currentDate),
    to: endOfMonth(currentDate)
  };

  const [filters, setFilters] = useState<FilterValues>({
    dateRange: defaultRange,
    puskesmasId: 'all',
    jenisLayanan: 'puskesmas'
  });

  // Fetch puskesmas list
  useEffect(() => {
    async function fetchPuskesmas() {
      try {
        const response = await fetch('/api/puskesmas');
        if (response.ok) {
          const data = await response.json();
          setPuskesmasList(data);
        }
      } catch (error) {
        console.error('Error fetching puskesmas:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPuskesmas();
  }, []);

  // Notify parent of filter changes
  useEffect(() => {
    onFilterChange?.(filters);
  }, [filters, onFilterChange]);

  const handleFilterChange = (
    key: keyof FilterValues,
    value: string | DateRange | undefined
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      dateRange: defaultRange,
      puskesmasId: 'all',
      jenisLayanan: 'puskesmas'
    });
  };

  const hasActiveFilters = useMemo(() => {
    const isDefaultDate =
      filters.dateRange?.from?.getTime() === defaultRange.from?.getTime() &&
      filters.dateRange?.to?.getTime() === defaultRange.to?.getTime();
    return (
      filters.puskesmasId !== 'all' ||
      filters.jenisLayanan !== 'puskesmas' ||
      !isDefaultDate
    );
  }, [filters, defaultRange]);

  const getDateLabel = () => {
    if (!filters.dateRange?.from) return 'Pilih Tanggal';

    if (!filters.dateRange.to) {
      return format(filters.dateRange.from, 'd MMM yyyy', { locale: id });
    }

    // Same month and year
    if (
      filters.dateRange.from.getMonth() === filters.dateRange.to.getMonth() &&
      filters.dateRange.from.getFullYear() ===
        filters.dateRange.to.getFullYear()
    ) {
      return `${format(filters.dateRange.from, 'd', { locale: id })} - ${format(filters.dateRange.to, 'd MMM yyyy', { locale: id })}`;
    }

    // Different months
    return `${format(filters.dateRange.from, 'd MMM', { locale: id })} - ${format(filters.dateRange.to, 'd MMM yyyy', { locale: id })}`;
  };

  const selectedPuskesmas = useMemo(() => {
    if (filters.puskesmasId === 'all') return 'Semua Puskesmas';
    return (
      puskesmasList.find((p) => p.id === filters.puskesmasId)?.namaPuskesmas ||
      'Pilih Puskesmas'
    );
  }, [filters.puskesmasId, puskesmasList]);

  // Quick date presets
  const setThisMonth = () => {
    handleFilterChange('dateRange', {
      from: startOfMonth(currentDate),
      to: endOfMonth(currentDate)
    });
  };

  const setLastMonth = () => {
    const lastMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1
    );
    handleFilterChange('dateRange', {
      from: startOfMonth(lastMonth),
      to: endOfMonth(lastMonth)
    });
  };

  const setThisYear = () => {
    handleFilterChange('dateRange', {
      from: new Date(currentDate.getFullYear(), 0, 1),
      to: new Date(currentDate.getFullYear(), 11, 31)
    });
  };

  return (
    <div
      className={cn(
        'bg-card flex flex-wrap items-center gap-2 rounded-lg border p-3',
        className
      )}
    >
      {/* Date Range Picker */}
      <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            size='sm'
            className='h-9 justify-between gap-1 px-3'
          >
            <IconCalendar className='h-4 w-4 shrink-0 opacity-70' />
            <span className='max-w-[180px] truncate'>{getDateLabel()}</span>
            <IconChevronDown className='h-3.5 w-3.5 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='start'>
          <div className='flex'>
            {/* Quick Presets */}
            <div className='space-y-1 border-r p-3'>
              <p className='text-muted-foreground mb-2 text-xs font-medium'>
                Preset
              </p>
              <Button
                variant='ghost'
                size='sm'
                className='h-8 w-full justify-start text-xs'
                onClick={setThisMonth}
              >
                Bulan Ini
              </Button>
              <Button
                variant='ghost'
                size='sm'
                className='h-8 w-full justify-start text-xs'
                onClick={setLastMonth}
              >
                Bulan Lalu
              </Button>
              <Button
                variant='ghost'
                size='sm'
                className='h-8 w-full justify-start text-xs'
                onClick={setThisYear}
              >
                Tahun Ini
              </Button>
            </div>
            {/* Calendar */}
            <div className='p-3'>
              <Calendar
                mode='range'
                selected={filters.dateRange}
                onSelect={(range) => handleFilterChange('dateRange', range)}
                numberOfMonths={2}
                defaultMonth={filters.dateRange?.from}
              />
              <div className='mt-3 flex justify-end border-t pt-3'>
                <Button
                  size='sm'
                  className='h-8'
                  onClick={() => setDatePopoverOpen(false)}
                >
                  Terapkan
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Puskesmas Searchable Combobox */}
      <Popover
        open={puskesmasPopoverOpen}
        onOpenChange={setPuskesmasPopoverOpen}
      >
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            size='sm'
            className='h-9 w-[220px] justify-between gap-1 px-3'
            disabled={isLoading}
          >
            <IconBuilding className='h-4 w-4 shrink-0 opacity-70' />
            <span className='flex-1 truncate text-left'>
              {isLoading ? 'Loading...' : selectedPuskesmas}
            </span>
            <IconChevronDown className='h-3.5 w-3.5 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-[280px] p-0' align='start'>
          <Command>
            <CommandInput placeholder='Cari puskesmas...' />
            <CommandList>
              <CommandEmpty>Tidak ditemukan.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value='all'
                  onSelect={() => {
                    handleFilterChange('puskesmasId', 'all');
                    setPuskesmasPopoverOpen(false);
                  }}
                >
                  <IconCheck
                    className={cn(
                      'mr-2 h-4 w-4',
                      filters.puskesmasId === 'all'
                        ? 'opacity-100'
                        : 'opacity-0'
                    )}
                  />
                  Semua Puskesmas
                </CommandItem>
                {puskesmasList.map((pkm) => (
                  <CommandItem
                    key={pkm.id}
                    value={pkm.namaPuskesmas}
                    onSelect={() => {
                      handleFilterChange('puskesmasId', pkm.id);
                      setPuskesmasPopoverOpen(false);
                    }}
                  >
                    <IconCheck
                      className={cn(
                        'mr-2 h-4 w-4',
                        filters.puskesmasId === pkm.id
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                    {pkm.namaPuskesmas}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Jenis Layanan */}
      {showJenisLayanan && (
        <Select
          value={filters.jenisLayanan}
          onValueChange={(value) => handleFilterChange('jenisLayanan', value)}
        >
          <SelectTrigger className='h-9 w-[140px]'>
            <SelectValue placeholder='Jenis Layanan' />
          </SelectTrigger>
          <SelectContent>
            {JENIS_LAYANAN_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Reset Button */}
      {hasActiveFilters && (
        <Button
          variant='ghost'
          size='sm'
          onClick={resetFilters}
          className='text-muted-foreground hover:text-foreground h-9 gap-1 px-2'
        >
          <IconRefresh className='h-4 w-4' />
          <span className='hidden sm:inline'>Reset</span>
        </Button>
      )}

      {/* Filter Summary Badge */}
      <div className='ml-auto hidden items-center gap-2 md:flex'>
        <Badge variant='secondary' className='text-xs font-normal'>
          {getDateLabel()}
          {filters.puskesmasId !== 'all' && ` • ${selectedPuskesmas}`}
          {showJenisLayanan &&
            filters.jenisLayanan !== 'puskesmas' &&
            ` • ${JENIS_LAYANAN_OPTIONS.find((j) => j.value === filters.jenisLayanan)?.label}`}
        </Badge>
      </div>
    </div>
  );
}

// Hook untuk menggunakan filter di pages
export function useFilter() {
  const currentDate = new Date();
  const [filterValues, setFilterValues] = useState<FilterValues>({
    dateRange: {
      from: startOfMonth(currentDate),
      to: endOfMonth(currentDate)
    },
    puskesmasId: 'all',
    jenisLayanan: 'puskesmas'
  });

  return {
    filters: filterValues,
    setFilters: setFilterValues
  };
}
