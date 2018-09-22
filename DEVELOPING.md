# Developing

Very basic instructions for now - these will be improved in the future.

1. Clone the repo.
1. Run `npm install` in the repo root. This uses Lerna to install dependencies in each package.
1. Run `npm run build` in the repo root. This runs an initial build of all projects.
1. Run `npm run build:watch` in a new terminal. This will recompile each TypeScript file whenever you edit it.

You can globally install the CLI packages to use them as you would if you globally installed them from npm. For example, to install the staff CLI:

```sh
cd packages/zephyr-staff-cli
npm i -g
```

This will symlink `zephyr-staff` from your global npm `bin` directory to the compiled output in this repo. You can now use `zephyr-staff` as normal. It should **not** be necessary to run this command after every change.
