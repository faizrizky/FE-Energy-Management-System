'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { cn } from '@/lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/**
 * Tipis banget di atas react-day-picker v9. Dua catatan soal nav
 * (Prev/Next) yang sengaja dibedain dari kalender biasa, ngikutin desain:
 *
 * - Prev: outline putih/slate, konsisten - hover cuma bg-slate-50.
 * - Next: default pale emerald (bg-emerald-100), begitu di-hover/focus
 *   baru solid emerald-500.
 *
 * navLayout="around" + grid per bulan (bukan Nav tunggal + absolute):
 * dengan numberOfMonths=2, satu Nav gabungan bakal render SEKALI sebelum
 * semua bulan, jadi tombol absolute-nya nggak punya "month" sebagai acuan
 * posisi - dia lari ke ancestor positioned TERDEKAT (bisa jadi popover-nya
 * sendiri), dan ujungnya nangkring di tengah vertikal alih-alih sejajar
 * caption. "around" bikin react-day-picker nempelin persis satu tombol
 * Previous ke bulan pertama & satu Next ke bulan terakhir, lalu grid
 * kolom [prev|caption|next] di tiap `.month` yang jamin dua-duanya selalu
 * segaris biarpun cuma salah satu yang ada di bulan itu.
 */
export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  animate = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      navLayout="around"
      animate={animate}
      className={cn('p-3', className)}
      classNames={{
        // items-start: dua bulan itu flex siblings - default align-items
        // itu "stretch", jadi bulan yang butuh 5 baris dipaksa setinggi
        // bulan sebelahnya yang 6 baris, terus grid-nya (lihat `month`
        // di bawah) nyebar sisa tinggi itu ke row caption juga, bikin
        // caption+header bulan yang lebih pendek ikut turun. items-start
        // matiin stretch itu - tiap bulan tingginya ngikutin konten
        // sendiri, sejajar di atas, dan yang barisnya lebih banyak
        // tinggal manjang ke bawah.
        months: 'flex flex-col gap-5 items-start sm:flex-row',
        month: 'grid w-full grid-cols-[2rem_1fr_2rem] items-center gap-y-2',
        month_caption: 'col-start-2 row-start-1 flex items-center justify-center pt-1',
        caption_label: 'text-sm font-bold text-slate-950',
        button_previous: cn(
          'col-start-1 row-start-1 flex size-8 items-center justify-center rounded-lg',
          'border border-slate-400 bg-white text-slate-700',
          'hover:bg-slate-50',
          'disabled:pointer-events-none disabled:opacity-40'
        ),
        button_next: cn(
          'col-start-3 row-start-1 flex size-8 items-center justify-center rounded-lg',
          'bg-emerald-100 text-emerald-700 transition-colors',
          'hover:bg-emerald-500 hover:text-white',
          'focus-visible:bg-emerald-500 focus-visible:text-white',
          'disabled:pointer-events-none disabled:opacity-40'
        ),
        month_grid: 'col-span-3 row-start-2 w-full border-collapse',

        // Animasi ganti bulan (prop `animate` di atas) - react-day-picker
        // sendiri yang pasang/lepas class ini lewat `classList.add/remove`
        // LANGSUNG ke DOM (bukan lewat React), dan classList API nolak
        // string yang ada spasinya - jadi tiap key di bawah ini WAJIB satu
        // class tunggal. Definisinya (gabungan animate-in/out dari
        // tailwindcss-animate) ada di app/globals.css lewat @apply.
        weeks_after_enter: 'rdp-weeks-after-enter',
        weeks_after_exit: 'rdp-weeks-after-exit',
        weeks_before_enter: 'rdp-weeks-before-enter',
        weeks_before_exit: 'rdp-weeks-before-exit',
        caption_after_enter: 'rdp-caption-after-enter',
        caption_after_exit: 'rdp-caption-after-exit',
        caption_before_enter: 'rdp-caption-before-enter',
        caption_before_exit: 'rdp-caption-before-exit',
        weekdays: 'flex',
        weekday: 'w-8 text-[11px] font-normal text-slate-500',
        week: 'mt-0.5 flex w-full',
        day: cn(
          'relative p-0 text-center text-xs focus-within:relative focus-within:z-20',
          '[&:has([aria-selected])]:bg-emerald-50',
          'first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md'
        ),
        day_button:
          'size-8 rounded-md p-0 font-normal hover:bg-slate-100 aria-selected:opacity-100',
        range_start: '!rounded-md !bg-emerald-500 !text-white',
        range_end: '!rounded-md !bg-emerald-500 !text-white',
        range_middle:
          'rounded-none aria-selected:!bg-emerald-100 aria-selected:!text-emerald-700',
        selected: '!bg-emerald-500 !text-white',
        today: 'font-semibold text-emerald-600',
        outside: 'text-slate-400 opacity-60',
        disabled: 'text-slate-300 opacity-50 hover:bg-transparent',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left' ? (
            <ChevronLeft className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          ),
      }}
      {...props}
    />
  );
}
