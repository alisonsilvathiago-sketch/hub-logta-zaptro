import React, { useMemo } from 'react';
import {
  formatActivityClock,
  type ActivityDomain,
  type OperationalActivityEvent,
} from '@/lib/operationalActivityLog';

const WEEKDAY_HEADERS = ['DOM.', 'SEG.', 'TER.', 'QUA.', 'QUI.', 'SEX.', 'SÁB.'] as const;
const MAX_VISIBLE_EVENTS = 4;

export type CalendarMonthCell = {
  key: string;
  dayNumber: number;
  inMonth: boolean;
  isToday: boolean;
  events: OperationalActivityEvent[];
};

export function buildCalendarMonthCells(
  year: number,
  month: number,
  eventsByDay: Map<string, OperationalActivityEvent[]>,
  today = new Date(),
): CalendarMonthCell[] {
  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: CalendarMonthCell[] = [];

  for (let i = startPad - 1; i >= 0; i -= 1) {
    const d = new Date(year, month, -i);
    const key = toDayKey(d);
    cells.push({
      key,
      dayNumber: d.getDate(),
      inMonth: false,
      isToday: isSameDay(d, today),
      events: eventsByDay.get(key) ?? [],
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const d = new Date(year, month, day);
    const key = toDayKey(d);
    cells.push({
      key,
      dayNumber: day,
      inMonth: true,
      isToday: isSameDay(d, today),
      events: eventsByDay.get(key) ?? [],
    });
  }

  let nextDay = 1;
  while (cells.length < 42) {
    const d = new Date(year, month + 1, nextDay);
    const key = toDayKey(d);
    cells.push({
      key,
      dayNumber: nextDay,
      inMonth: false,
      isToday: isSameDay(d, today),
      events: eventsByDay.get(key) ?? [],
    });
    nextDay += 1;
  }

  return cells;
}

function toDayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function eventLabel(event: OperationalActivityEvent): string {
  const time = formatActivityClock(event.time);
  const title = event.title.length > 24 ? `${event.title.slice(0, 22)}…` : event.title;
  return `${time} ${title}`;
}

type Props = {
  year: number;
  month: number;
  eventsByDay: Map<string, OperationalActivityEvent[]>;
  selectedDay: string | null;
  onSelectDay: (key: string) => void;
  onSelectEvent: (event: OperationalActivityEvent) => void;
};

const ActivityMonthCalendar: React.FC<Props> = ({
  year,
  month,
  eventsByDay,
  selectedDay,
  onSelectDay,
  onSelectEvent,
}) => {
  const cells = useMemo(
    () => buildCalendarMonthCells(year, month, eventsByDay),
    [year, month, eventsByDay],
  );

  return (
    <div className="ls-act-cal__grid-wrap">
      <div className="ls-act-cal__weekdays" aria-hidden>
        {WEEKDAY_HEADERS.map((label) => (
          <span key={label} className="ls-act-cal__weekday">
            {label}
          </span>
        ))}
      </div>
      <div className="ls-act-cal__grid" role="grid" aria-label="Calendário de atividades">
        {cells.map((cell) => (
          <div
            key={cell.key}
            role="gridcell"
            className={`ls-act-cal__cell${cell.inMonth ? '' : ' ls-act-cal__cell--outside'}${cell.isToday ? ' ls-act-cal__cell--today' : ''}${selectedDay === cell.key ? ' ls-act-cal__cell--selected' : ''}`}
            onClick={() => onSelectDay(cell.key)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectDay(cell.key);
              }
            }}
            tabIndex={0}
          >
            <button
              type="button"
              className={`ls-act-cal__day-btn${cell.isToday ? ' ls-act-cal__day-btn--today' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectDay(cell.key);
              }}
            >
              {cell.dayNumber}
            </button>
            <div className="ls-act-cal__events">
              {cell.events.slice(0, MAX_VISIBLE_EVENTS).map((event) => (
                <EventPill key={event.id} event={event} onSelect={onSelectEvent} />
              ))}
              {cell.events.length > MAX_VISIBLE_EVENTS ? (
                <button
                  type="button"
                  className="ls-act-cal__more"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectDay(cell.key);
                  }}
                >
                  +{cell.events.length - MAX_VISIBLE_EVENTS} mais
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

function EventPill({
  event,
  onSelect,
}: {
  event: OperationalActivityEvent;
  onSelect: (event: OperationalActivityEvent) => void;
}) {
  const className = `ls-act-cal__event ls-act-cal__event--${event.domain as ActivityDomain} ls-act-cal__event--${event.result}`;

  return (
    <button
      type="button"
      className={className}
      title={event.description}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(event);
      }}
    >
      {eventLabel(event)}
    </button>
  );
}

export default ActivityMonthCalendar;
