require('dotenv').load();
const checkout = require('./checkout');

const checkoutStudent = async () => {
  const checkoutPath = './zwang180';
  const repoPath = 'mp7';
  const host = 'https://github-dev.cs.illinois.edu/api/v3';
  const org = 'cs225sp18';
  const repo = 'zwang180';
  await checkout(checkoutPath, repoPath, host, org, repo);
};

const checkoutAssignment = async () => {
  const checkoutPath = './mp7';
  const repoPath = 'mp7';
  const host = 'https://github-dev.cs.illinois.edu/api/v3';
  const org = 'cs225-staff';
  const repo = 'assignments';
  await checkout(checkoutPath, repoPath, host, org, repo);
};

(async () => {
  try {
    let start = new Date();
    await checkoutStudent();
    console.log(`Checked out student: ${new Date() - start}ms`);

    start = new Date();
    await checkoutAssignment();
    console.log(`Checked out assignment: ${new Date() - start}ms`);
  } catch (e) {
    console.error(e);
  }

})();
