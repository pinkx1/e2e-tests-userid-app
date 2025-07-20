import fs from 'fs';
import path from 'path';

const filePath = path.resolve(__dirname, '../.cache/created-entities.json');

type EntityData = {
  users: string[];
  params: string[];
  domains: string[];
};

function loadData(): EntityData {
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  return { users: [], params: [], domains: [] };
}

function saveData(data: EntityData) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

const data = loadData();

export const createdUsers = data.users;
export const createdParams = data.params;
export const createdDomains = data.domains;

export function trackUser(nickname: string) {
  if (!createdUsers.includes(nickname)) {
    createdUsers.push(nickname);
    saveData({ users: createdUsers, params: createdParams, domains: createdDomains });
  }
}

export function trackParam(name: string) {
  if (!createdParams.includes(name)) {
    createdParams.push(name);
    saveData({ users: createdUsers, params: createdParams, domains: createdDomains });
  }
}

export function trackDomain(name: string) {
  if (!createdDomains.includes(name)) {
    createdDomains.push(name);
    saveData({ users: createdUsers, params: createdParams, domains: createdDomains });
  }
}

export function resetAll() {
  saveData({ users: [], params: [], domains: [] });
}

export function untrackUser(nickname: string) {
  const index = createdUsers.indexOf(nickname);
  if (index !== -1) {
    createdUsers.splice(index, 1);
    saveData({ users: createdUsers, params: createdParams, domains: createdDomains });
  }
}

export function untrackParam(name: string) {
  const index = createdParams.indexOf(name);
  if (index !== -1) {
    createdParams.splice(index, 1);
    saveData({ users: createdUsers, params: createdParams, domains: createdDomains });
  }
}

export function untrackDomain(name: string) {
  const index = createdDomains.indexOf(name);
  if (index !== -1) {
    createdDomains.splice(index, 1);
    saveData({ users: createdUsers, params: createdParams, domains: createdDomains });
  }
}
