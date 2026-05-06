import { alertCount, completionForFacility, facilityStatusRows, navCounts, portfolioKpis } from '@/lib/v1/metrics';
import {
  alerts,
  bills,
  facilities,
  getFacility,
  getParameter,
  getPersonName,
  monthlySummaries,
  parameters,
  personnel,
  submissions,
} from '@/lib/v1/sample-data';

export const v1Db = {
  facilities: {
    list: () => facilities,
    get: getFacility,
    statusRows: facilityStatusRows,
  },
  personnel: {
    list: () => personnel,
    name: getPersonName,
  },
  parameters: {
    list: () => parameters,
    get: getParameter,
  },
  submissions: {
    list: () => submissions,
    completionForFacility,
  },
  bills: {
    list: () => bills,
    detail: (id: string) => bills.find(bill => bill.id === id) ?? null,
  },
  alerts: {
    list: () => alerts,
    count: alertCount,
  },
  monthlySummaries: {
    list: () => monthlySummaries,
  },
  dashboards: {
    navCounts,
    portfolioKpis,
  },
};
