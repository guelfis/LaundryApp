import { describe, it, expect } from 'vitest';
import { formatMaintenanceBlockDisplay } from '../formatMaintenanceBlockDisplay';

describe('formatMaintenanceBlockDisplay', () => {
  it('should format a single-day maintenance block correctly without repeating the day', () => {
    const result = formatMaintenanceBlockDisplay('2026-10-08', 8, '2026-10-08', 17);
    expect(result.title).toBe('Oct 8, 2026');
    expect(result.subtitle).toBe('8 - 17');
  });

  it('should format a multi-day maintenance block within the same month', () => {
    const result = formatMaintenanceBlockDisplay('2026-10-08', 8, '2026-10-10', 12);
    expect(result.title).toBe('Oct 8 – 10, 2026');
    expect(result.subtitle).toBe('8 on Oct 8 — 12 on Oct 10');
  });

  it('should format a multi-day maintenance block spanning across different months', () => {
    const result = formatMaintenanceBlockDisplay('2026-09-30', 18, '2026-10-02', 10);
    expect(result.title).toBe('Sep 30 – Oct 2, 2026');
    expect(result.subtitle).toBe('18 on Sep 30 — 10 on Oct 2');
  });

  it('should format a multi-day maintenance block spanning across different years', () => {
    const result = formatMaintenanceBlockDisplay('2026-12-30', 8, '2027-01-02', 12);
    expect(result.title).toBe('Dec 30, 2026 – Jan 2, 2027');
    expect(result.subtitle).toBe('8 on Dec 30 — 12 on Jan 2');
  });

  it('should handle empty inputs gracefully', () => {
    const result = formatMaintenanceBlockDisplay('', 0, '', 0);
    expect(result.title).toBe('');
    expect(result.subtitle).toBe('');
  });
});
