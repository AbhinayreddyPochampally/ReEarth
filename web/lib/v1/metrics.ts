import { alerts, facilities, logActivities, parameters, submissions } from './sample-data';
import type { AlertKind, Facility } from './types';

export function completionForFacility(facilityId: string): { done: number; total: number; pct: number } {
  const dailyCodes = new Set(parameters.filter(parameter => parameter.cadence === 'daily').map(parameter => parameter.code));
  const total = dailyCodes.size;
  const done = new Set(
    submissions
      .filter(submission => submission.facilityId === facilityId && dailyCodes.has(submission.parameterCode))
      .map(submission => submission.parameterCode),
  ).size;
  return { done, total, pct: Math.round((done / total) * 100) };
}

// Eight-card KPI grid per design doc §29.2 + UI sketch p26.
export function portfolioKpis(): { label: string; value: string; unit: string; delta: string; tone: 'good' | 'warn' }[] {
  return [
    { label: 'Water withdrawn',     value: '48,210', unit: 'm³',     delta: '−4% vs last',  tone: 'good' },
    { label: 'Water-positive',      value: '1.34',   unit: '',       delta: '+0.08',         tone: 'good' },
    { label: 'Energy',              value: '286',    unit: 'TOE',    delta: '−2%',           tone: 'good' },
    { label: 'Per garment',         value: '1.8',    unit: 'kg CO₂e', delta: '−0.1',         tone: 'good' },
    { label: 'Renewable',           value: '38',     unit: '%',      delta: '+1pp',          tone: 'good' },
    { label: 'Reuse',               value: '62',     unit: '%',      delta: '−2pp',          tone: 'warn' },
    { label: 'Scope 1+2',           value: '742',    unit: 'tCO₂e',  delta: '−3% vs last',   tone: 'good' },
    { label: 'EPI',                 value: '4.2',    unit: 'kWh/sqft', delta: 'flat',         tone: 'good' },
  ];
}

export function navCounts(): { logs: number; alerts: number } {
  const reviewableParameters = new Set(parameters.map(parameter => parameter.code));
  return {
    logs: submissions.filter(submission => submission.status === 'pending' && reviewableParameters.has(submission.parameterCode)).length,
    alerts: alerts.filter(alert => alert.status === 'open').length,
  };
}

export function facilityLogSnapshot(facilityId: string): {
  energyKwh: number;
  waterM3: number;
  pendingLogs: number;
  completionPct: number;
} {
  const completion = completionForFacility(facilityId);
  const energyKwh = submissions
    .filter(submission => submission.facilityId === facilityId && submission.parameterCode === 'grid_kwh')
    .reduce((sum, submission) => sum + submission.value, 0);
  const waterM3 = submissions
    .filter(submission => submission.facilityId === facilityId && ['groundwater_m3', 'stp_outlet_m3'].includes(submission.parameterCode))
    .reduce((sum, submission) => sum + submission.value, 0);

  return {
    energyKwh,
    waterM3,
    pendingLogs: Math.max(completion.total - completion.done, 0),
    completionPct: completion.pct,
  };
}

export function recentLogActivities(facilityId: string) {
  return logActivities.filter(activity => activity.facilityId === facilityId);
}

export function alertCount(kind: AlertKind): number {
  return alerts.filter(alert => alert.kind === kind && alert.status === 'open').length;
}

export function facilityStatusRows(): {
  facility: Facility;
  completion: number;
  openAlerts: number;
  renewablePct: number;
  waterPositive: number;
}[] {
  return facilities.map((facility, index) => ({
    facility,
    completion: completionForFacility(facility.id).pct || Math.max(55, 95 - (index % 5) * 8),
    openAlerts: alerts.filter(alert => alert.facilityId === facility.id && alert.status === 'open').length,
    renewablePct: facility.flags.hasSolar ? 34 + (index % 6) * 2 : 0,
    waterPositive: facility.kind === 'factory' ? Number((1.04 + (index % 5) * 0.07).toFixed(2)) : 0,
  }));
}
