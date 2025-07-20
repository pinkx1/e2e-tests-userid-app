import { faker } from '@faker-js/faker';

export function generateValidUserData(domainId: string) {
  return {
    nickname: faker.internet.username().toLowerCase(),
    email: faker.internet.email({ provider: 'testsh.com' }),
    domainId,
    fullName: faker.person.fullName(),
    password: 'Test1234!'
  };
}
