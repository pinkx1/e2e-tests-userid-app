import { faker } from '@faker-js/faker';

export function generateValidDomainData() {
  return {
    domain: faker.internet.domainWord() + Date.now(),
    otpEmail: faker.internet.email({ provider: 'testsh.com' }),
    otpUrl: faker.internet.url(),
    teamName: faker.company.name(),
    homepage: faker.internet.url()
  };
}

export function generateInvalidEmail() {
  return 'invalid-email';
}

export function generateInvalidUrl() {
  return 'not-a-url';
}
