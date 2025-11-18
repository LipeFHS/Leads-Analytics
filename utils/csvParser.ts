import { Lead, LeadType } from '../types';

// Regex patterns for flexible header matching
const HEADER_PATTERNS = {
  campaign: /campanha|campaign|camp|utm_campaign|ad_name/i,
  medium: /medium|meio|m.dia|midia|canal|channel|utm_medium/i,
  source: /source|origem|fonte|utm_source/i,
  url: /url|link|site|ref|href|permalink|landing/i,
  email: /e-mail|email|mail|correio|contato|contact/i,
  name: /nome|name|cliente|client|lead|person|pessoa|full_name|first_name/i
};

// Identify which standard column a header string corresponds to
const normalizeHeader = (header: string): string => {
  const h = header.trim().toLowerCase().replace(/['"]/g, '');
  if (!h) return 'unknown';

  if (HEADER_PATTERNS.campaign.test(h)) return 'campaign';
  if (HEADER_PATTERNS.medium.test(h)) return 'medium';
  if (HEADER_PATTERNS.source.test(h)) return 'source';
  if (HEADER_PATTERNS.url.test(h)) return 'url';
  if (HEADER_PATTERNS.email.test(h)) return 'email';
  if (HEADER_PATTERNS.name.test(h)) return 'name';
  
  return 'unknown';
};

// Detect separator based on a specific line
const detectSeparator = (line: string): string => {
  if (!line) return ',';
  const semicolons = (line.match(/;/g) || []).length;
  const commas = (line.match(/,/g) || []).length;
  const tabs = (line.match(/\t/g) || []).length;
  const pipes = (line.match(/\|/g) || []).length;

  const max = Math.max(semicolons, commas, tabs, pipes);
  if (max === 0) return ','; // Default
  if (semicolons === max) return ';';
  if (commas === max) return ',';
  if (tabs === max) return '\t';
  return '|';
};

const parseCSVLine = (text: string, separator: string): string[] => {
  const result: string[] = [];
  let cur = '';
  let inQuote = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuote) {
      if (char === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          cur += '"'; // Escaped quote
          i++;
        } else {
          inQuote = false;
        }
      } else {
        cur += char;
      }
    } else {
      if (char === '"') {
        inQuote = true;
      } else if (char === separator) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
  }
  result.push(cur.trim());
  return result;
};

// Smart function to find the header row index and the separator
const findBestHeaderRow = (lines: string[]): { index: number; separator: string; headers: string[] } | null => {
  let bestScore = 0;
  let bestResult = null;

  // Scan first 15 lines
  const limit = Math.min(lines.length, 15);

  for (let i = 0; i < limit; i++) {
    const line = lines[i];
    if (!line || !line.trim()) continue;

    const separator = detectSeparator(line);
    const columns = parseCSVLine(line, separator);
    
    let score = 0;
    columns.forEach(col => {
      if (normalizeHeader(col) !== 'unknown') {
        score++;
      }
    });

    if (score > bestScore) {
      bestScore = score;
      bestResult = { index: i, separator, headers: columns };
    }
  }
  
  return bestResult;
};

export const parseCSV = (content: string): Lead[] => {
  // Normalize line endings
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  
  const headerInfo = findBestHeaderRow(lines);
  if (!headerInfo || headerInfo.headers.length === 0) {
    return [];
  }

  const { index: headerIndex, separator, headers } = headerInfo;
  const headerMap: Record<string, number> = {};
  
  headers.forEach((h, idx) => {
    const key = normalizeHeader(h);
    if (key !== 'unknown') {
      headerMap[key] = idx;
    }
  });

  const leads: Lead[] = [];

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const cols = parseCSVLine(line, separator);
    // Ensure we have enough columns to be meaningful
    if (cols.length < 2) continue; 

    const getVal = (key: string) => {
      const idx = headerMap[key];
      return (idx !== undefined && cols[idx]) ? cols[idx].trim() : '';
    };

    const source = getVal('source');
    const medium = getVal('medium');
    const campaign = getVal('campaign');
    const url = getVal('url');

    // Classification Logic
    let type = LeadType.DIRECT;
    const sLower = source.toLowerCase();
    const mLower = medium.toLowerCase();
    const uLower = url.toLowerCase();

    const isPaid = 
      mLower.includes('cpc') || mLower.includes('paid') || mLower.includes('ppc') || 
      sLower.includes('ad') || uLower.includes('gclid') || uLower.includes('fbclid');

    const isOrganic = mLower.includes('organic') || mLower.includes('social') || (!isPaid && sLower.length > 0);

    if (isPaid) {
      type = LeadType.PAID;
    } else if (isOrganic) {
      type = LeadType.ORGANIC;
    } else if (mLower.includes('referral')) {
      type = LeadType.REFERRAL;
    } else {
      type = LeadType.DIRECT;
    }

    leads.push({
      id: `row-${i}`,
      name: getVal('name') || 'Unknown',
      email: getVal('email') || '-',
      source: source || '-',
      medium: medium || '-',
      campaign: campaign || '-',
      url: url || '',
      type
    });
  }

  return leads;
};