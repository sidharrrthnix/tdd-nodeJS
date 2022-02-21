const app = require('./src/app');
const sequelize = require('./src/config/database');

sequelize.sync({ force: true });
app.listen(3000, () => console.log('app is running'));

// console.log('env: ' + process.env.NODE_ENV);
