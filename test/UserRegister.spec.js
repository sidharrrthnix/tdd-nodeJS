const request = require('supertest');
const app = require('../src/app');
const sequelize = require('../src/config/database');
const User = require('../src/user/User');
beforeAll(() => {
  return sequelize.sync();
});
beforeEach(() => {
  return User.destroy({ truncate: true });
});
const validUser = {
  username: 'user1',
  email: 'user1@mail.com',
  password: 'P4ssword',
};
const postUser = (user = validUser) => {
  return request(app).post('/api/1.0/users').send(user);
};
describe('User Registration', () => {
  it('returns 200 OK when signup request is valid', (done) => {
    postUser().then((response) => {
      expect(response.status).toBe(200);
      done();
    });
    // .expect(200, done);
  });
  it('returns message `User Created` when request is valid', (done) => {
    postUser().then((res) => {
      expect(res.body.message).toBe('User created');
      done();
    });
  });
  it('saves the user to the database', (done) => {
    postUser().then(() => {
      User.findAll().then((users) => {
        expect(users.length).toBe(1);
        done();
      });
    });
  });
  it('saves the user to the database', (done) => {
    postUser().then(() => {
      User.findAll().then((users) => {
        const user = users[0];
        expect(user.username).toBe('user1');
        expect(user.email).toBe('user1@mail.com');
        done();
      });
    });
  });
  it('hashes the password to the database', (done) => {
    postUser().then(() => {
      User.findAll().then((users) => {
        const user = users[0];
        expect(user.password).not.toBe('Password');

        done();
      });
    });
  });
  it('checks the status for null username', async () => {
    const response = await postUser({ username: null, email: 'user1@mail.com', password: 'Password' });
    expect(response.status).toBe(400);
  });
  it('validator middleware', async () => {
    const response = await postUser({ username: null, email: 'user1@mail.com', password: 'Password' });

    expect(response.body.validationErrors).not.toBeUndefined();
  });
  it('validator middleware for username', async () => {
    const response = await postUser({ username: null, email: 'user1@mail.com', password: 'Password' });

    expect(response.body.validationErrors.username).toBe('Username cannot be null');
  });

  it('validator middleware for email and username', async () => {
    const response = await postUser({ username: null, email: null, password: 'P4ssword' });
    const body = response.body;
    // console.log(Object.keys(body.validationErrors));
    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);
  });

  test.each([
    ['username', 'Username cannot be null'],
    ['email', 'email cannot be null'],
    ['password', 'Password cannot be null'],
  ])('when %s is null %s is recieved', async (field, message) => {
    const user = {
      username: 'user1',
      email: 'user1@mail.com',
      password: 'Password',
    };
    user[field] = null;
    const response = await postUser(user);
    const body = response.body;
    expect(body.validationErrors[field]).toBe(message);
  });
  test.each`
    field         | value             | expectedMessage
    ${'username'} | ${null}           | ${'Username cannot be null'}
    ${'username'} | ${'usr'}          | ${'Username must be min 4 and max 32 characters'}
    ${'username'} | ${'s'.repeat(50)} | ${'Username must be min 4 and max 32 characters'}
    ${'email'}    | ${null}           | ${'email cannot be null'}
    ${'email'}    | ${'usr.com'}      | ${'Email is not valid'}
    ${'email'}    | ${'usr@com'}      | ${'Email is not valid'}
    ${'email'}    | ${'usr.mail'}     | ${'Email is not valid'}
    ${'password'} | ${null}           | ${'Password cannot be null'}
    ${'password'} | ${'P4ss'}         | ${'Password must be atleast 6 characters long'}
    ${'password'} | ${'Password'}     | ${'Password must have atleast 1 uppercase, 1 lowercase and 1 number in it'}
    ${'password'} | ${'123456'}       | ${'Password must have atleast 1 uppercase, 1 lowercase and 1 number in it'}
    ${'password'} | ${'lowercase'}    | ${'Password must have atleast 1 uppercase, 1 lowercase and 1 number in it'}
    ${'password'} | ${'UPPERCASE'}    | ${'Password must have atleast 1 uppercase, 1 lowercase and 1 number in it'}
    ${'password'} | ${'loweerUPPER'}  | ${'Password must have atleast 1 uppercase, 1 lowercase and 1 number in it'}
  `('returns $expectedMessage when $field is $value', async ({ field, expectedMessage, value }) => {
    const user = {
      username: 'user1',
      email: 'user1@mail.com',
      password: 'Password',
    };
    user[field] = value;
    const response = await postUser(user);
    const body = response.body;
    expect(body.validationErrors[field]).toBe(expectedMessage);
  });
  it('Email in use', async () => {
    await User.create({ ...validUser });
    const response = await postUser();
    expect(response.body.validationErrors.email).toBe('Email in use');
  });
  it('check username validation and check for Email in use', async () => {
    await User.create({ ...validUser });
    const response = await postUser({
      username: 'usr',
      email: 'user1@mail.com',
      password: 'P4ssword',
    });
    const body = response.body;
    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);
  });
});
