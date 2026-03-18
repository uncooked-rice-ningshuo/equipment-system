import type { Device, DeviceStatus, NewDevice } from '@equipment/shared';
import * as XLSX from 'xlsx';

export type DeviceExcelRow = {
  rowNumber: number;
  code: string;
  name: string;
  type?: string;
  brand?: string;
  model?: string;
  price?: number;
  location?: string;
  status?: DeviceStatus;
};

export type DeviceExcelRowError = {
  rowNumber: number;
  message: string;
};

const HEADERS: Array<{
  key: keyof Omit<DeviceExcelRow, 'rowNumber'>;
  title: string;
  aliases: string[];
}> = [
  { key: 'code', title: '设备编号', aliases: ['设备编号', 'code'] },
  { key: 'name', title: '设备名称', aliases: ['设备名称', 'name'] },
  { key: 'type', title: '设备类型', aliases: ['设备类型', 'type'] },
  { key: 'brand', title: '设备厂商', aliases: ['设备厂商', 'brand'] },
  { key: 'model', title: '规格型号', aliases: ['规格型号', 'model'] },
  { key: 'price', title: '单价', aliases: ['单价', 'price'] },
  { key: 'location', title: '存放地点', aliases: ['存放地点', 'location'] },
  {
    key: 'status',
    title: '设备状态',
    aliases: ['设备状态', 'status'],
  },
];

const STATUS_LABEL_TO_VALUE: Record<string, DeviceStatus> = {
  available: 'available',
  borrowed: 'borrowed',
  maintenance: 'maintenance',
  scrap: 'scrap',
  可用: 'available',
  已借出: 'borrowed',
  维修中: 'maintenance',
  已报废: 'scrap',
};

function normalizeCell(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string') {
    const s = value.trim();
    return s ? s : undefined;
  }
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  const s = String(value).trim();
  return s ? s : undefined;
}

function parsePrice(raw: unknown): number | undefined {
  if (raw === null || raw === undefined || raw === '') return undefined;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : undefined;
  const s = normalizeCell(raw);
  if (!s) return undefined;
  const n = Number(s);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

function parseStatus(raw: unknown): DeviceStatus | undefined {
  const s = normalizeCell(raw);
  if (!s) return undefined;
  return STATUS_LABEL_TO_VALUE[s] ?? undefined;
}

function normalizeHeader(value: unknown): string {
  return (normalizeCell(value) ?? '').toLowerCase();
}

function buildHeaderIndexMap(headerRow: unknown[]): Map<number, string> {
  const map = new Map<number, string>();
  for (let i = 0; i < headerRow.length; i++) {
    const h = normalizeHeader(headerRow[i]);
    if (!h) continue;
    const match = HEADERS.find((x) =>
      x.aliases.some((a) => a.toLowerCase() === h),
    );
    if (match) map.set(i, match.key);
  }
  return map;
}

export function buildDevicesWorkbookBuffer(devices: Device[]): ArrayBuffer {
  const rows = devices.map((d) => [
    d.code,
    d.name,
    d.type ?? '',
    d.brand ?? '',
    d.model ?? '',
    d.price ?? '',
    d.location ?? '',
    d.status ?? 'available',
  ]);

  const aoa = [HEADERS.map((h) => h.title), ...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'devices');
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
}

export function buildDevicesTemplateWorkbookBuffer(): ArrayBuffer {
  const exampleRow = [
    'PC-001',
    '笔记本电脑',
    '电脑',
    'Apple',
    'MacBook Pro 16',
    19999,
    '实验室 A 栋 301',
    'available',
  ];
  const aoa = [HEADERS.map((h) => h.title), exampleRow];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'template');
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
}

export function parseDevicesWorkbookBuffer(buffer: ArrayBuffer): {
  rows: DeviceExcelRow[];
  errors: DeviceExcelRowError[];
} {
  const wb = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = wb.SheetNames[0];
  if (!firstSheetName) {
    return {
      rows: [],
      errors: [{ rowNumber: 0, message: 'Excel 文件不包含工作表' }],
    };
  }

  const ws = wb.Sheets[firstSheetName];
  const aoa = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][];
  if (!aoa.length) {
    return {
      rows: [],
      errors: [{ rowNumber: 0, message: 'Excel 工作表为空' }],
    };
  }

  const headerRow = aoa[0] ?? [];
  const headerIndexMap = buildHeaderIndexMap(headerRow);
  if (!headerIndexMap.size) {
    return {
      rows: [],
      errors: [{ rowNumber: 1, message: '未识别到表头列，请使用模板表头' }],
    };
  }

  const rows: DeviceExcelRow[] = [];
  const errors: DeviceExcelRowError[] = [];

  for (let i = 1; i < aoa.length; i++) {
    const rawRow = aoa[i] ?? [];
    const excelRowNumber = i + 1;
    const hasAnyValue = rawRow.some((v) => normalizeCell(v));
    if (!hasAnyValue) continue;

    const record: any = { rowNumber: excelRowNumber };
    for (const [colIndex, key] of headerIndexMap.entries()) {
      const cell = rawRow[colIndex];
      if (key === 'price') {
        record.priceRaw = normalizeCell(cell);
        record.price = parsePrice(cell);
        continue;
      }
      if (key === 'status') {
        record.statusRaw = normalizeCell(cell);
        record.status = parseStatus(cell);
        continue;
      }
      record[key] = normalizeCell(cell);
    }

    const code = normalizeCell(record.code);
    const name = normalizeCell(record.name);

    if (!code) {
      errors.push({ rowNumber: excelRowNumber, message: '设备编号(code)必填' });
      continue;
    }
    if (!name) {
      errors.push({ rowNumber: excelRowNumber, message: '设备名称(name)必填' });
      continue;
    }

    if (record.statusRaw && record.status === undefined) {
      errors.push({
        rowNumber: excelRowNumber,
        message: '设备状态(status)非法',
      });
      continue;
    }

    if (record.priceRaw && record.price === undefined) {
      errors.push({
        rowNumber: excelRowNumber,
        message: '单价(price)不是数字',
      });
      continue;
    }

    rows.push({
      rowNumber: excelRowNumber,
      code,
      name,
      type: normalizeCell(record.type),
      brand: normalizeCell(record.brand),
      model: normalizeCell(record.model),
      price: record.price,
      location: normalizeCell(record.location),
      status: (record.status ?? undefined) as DeviceStatus | undefined,
    });
  }

  return { rows, errors };
}

export function toNewDeviceForCreate(
  row: DeviceExcelRow,
): Pick<NewDevice, 'code' | 'name'> & Partial<NewDevice> {
  return {
    code: row.code,
    name: row.name,
    type: row.type,
    brand: row.brand,
    model: row.model,
    price: row.price,
    location: row.location,
    status: row.status ?? 'available',
  };
}

export function toNewDeviceForUpdate(row: DeviceExcelRow): Partial<NewDevice> {
  return {
    name: row.name,
    type: row.type,
    brand: row.brand,
    model: row.model,
    price: row.price,
    location: row.location,
    status: row.status,
  };
}

export function downloadExcelBuffer(buffer: ArrayBuffer, fileName: string) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
