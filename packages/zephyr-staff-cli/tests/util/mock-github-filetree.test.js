/* eslint-env jest */
const mockGithubFiletree = require('./mock-github-filetree')();

describe('mock-github-filetree', () => {
  it('responds with the root directory (empty string)', async () => {
    const files = await mockGithubFiletree({ path: '' });
    expect(files).toEqual([
      { name: 'mp1', path: 'mp1', size: 0, type: 'dir' },
      { name: 'mp2', path: 'mp2', size: 0, type: 'dir' },
      { name: '.gitignore', path: '.gitignore', size: 7, type: 'file' }
    ]);
  });

  it('responds with the root directory (/)', async () => {
    const files = await mockGithubFiletree({ path: '/' });
    expect(files).toEqual([
      { name: 'mp1', path: 'mp1', size: 0, type: 'dir' },
      { name: 'mp2', path: 'mp2', size: 0, type: 'dir' },
      { name: '.gitignore', path: '.gitignore', size: 7, type: 'file' }
    ]);
  });

  it('resolves .gitignore', async () => {
    const files = await mockGithubFiletree({ path: '.gitignore' });
    expect(files).toEqual([{ name: '.gitignore', path: '.gitignore', size: 7, type: 'file' }]);
  });

  it('resolves the contents of the mp1 directory', async () => {
    const files = await mockGithubFiletree({ path: 'mp1' });
    expect(files).toEqual([
      { name: 'tests', path: 'mp1/tests', size: 0, type: 'dir' },
      { name: 'mp1.cpp', path: 'mp1/mp1.cpp', size: 7, type: 'file' }
    ]);
  });

  it('handles missing file', async () => {
    expect(mockGithubFiletree({ path: 'mp1/rip/not-here.js' })).rejects.toThrow();
  });
});
