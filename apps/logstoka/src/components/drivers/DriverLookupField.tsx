import React, { useEffect, useMemo, useRef, useState } from 'react';
import { History, UserCheck } from 'lucide-react';
import {
  formatDriverCnpj,
  formatDriverCpf,
  searchDemoDrivers,
} from '@/lib/demoDriverStore';
import type { DemoDriver } from '@/lib/logstokaDemoSeed';
import './driverLookupField.css';

export type DriverLookupValue = {
  driverId: string;
  driverName: string;
  driverCpf: string;
  companyName: string;
  companyCnpj: string;
};

type Props = {
  companyId: string | null;
  value: DriverLookupValue;
  onChange: (patch: Partial<DriverLookupValue>) => void;
  placeholder?: string;
  disabled?: boolean;
};

const DriverLookupField: React.FC<Props> = ({
  companyId,
  value,
  onChange,
  placeholder = 'Nome, CPF, CNPJ ou empresa',
  disabled = false,
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(value.driverName);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [knownDriver, setKnownDriver] = useState<DemoDriver | null>(null);

  useEffect(() => {
    setQuery(value.driverName);
  }, [value.driverName]);

  const results = useMemo(
    () => searchDemoDrivers(companyId, query, 8),
    [companyId, query],
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [results.length, query]);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const pickDriver = (driver: DemoDriver) => {
    setKnownDriver(driver);
    setQuery(driver.full_name);
    setOpen(false);
    onChange({
      driverId: driver.id,
      driverName: driver.full_name,
      driverCpf: driver.cpf,
      companyName: driver.company_name,
      companyCnpj: driver.company_cnpj,
    });
  };

  const handleInputChange = (text: string) => {
    setQuery(text);
    setKnownDriver(null);
    setOpen(text.trim().length >= 2);
    onChange({
      driverId: '',
      driverName: text,
      driverCpf: value.driverCpf,
      companyName: value.companyName,
      companyCnpj: value.companyCnpj,
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      pickDriver(results[activeIndex]);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  const visitsLabel =
    knownDriver && knownDriver.total_visits > 0
      ? `${knownDriver.total_visits} visita${knownDriver.total_visits === 1 ? '' : 's'} · ${knownDriver.warehouse_ids.length} CD${knownDriver.warehouse_ids.length === 1 ? '' : 's'}`
      : null;

  return (
    <div className="ls-driver-lookup" ref={wrapRef}>
      <div className="ls-driver-lookup__input-wrap">
        <input
          className="ls-input"
          placeholder={placeholder}
          value={query}
          disabled={disabled}
          autoComplete="off"
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {knownDriver ? (
          <span className="ls-driver-lookup__badge" title="Cadastro empresa-wide">
            <UserCheck size={11} aria-hidden />
            Cadastro
          </span>
        ) : null}
      </div>

      {open && results.length > 0 ? (
        <ul className="ls-driver-lookup__list" role="listbox">
          {results.map((driver, index) => (
            <li key={driver.id}>
              <button
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={`ls-driver-lookup__option${index === activeIndex ? ' ls-driver-lookup__option--active' : ''}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pickDriver(driver)}
              >
                <span className="ls-driver-lookup__option-name">{driver.full_name}</span>
                <span className="ls-driver-lookup__option-meta">
                  {formatDriverCpf(driver.cpf)} · {driver.company_name} · {formatDriverCnpj(driver.company_cnpj)}
                  {driver.total_visits > 1 ? ` · ${driver.total_visits} visitas` : ''}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {visitsLabel ? (
        <p className="ls-driver-lookup__hint ls-driver-lookup__hint--found">
          <History size={11} aria-hidden style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
          Histórico na empresa: {visitsLabel}
        </p>
      ) : query.trim().length >= 2 && results.length === 0 ? (
        <p className="ls-driver-lookup__hint">Nenhum cadastro encontrado — preencha CPF e empresa abaixo.</p>
      ) : null}
    </div>
  );
};

export default DriverLookupField;
