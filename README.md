# zephyr

> A grading platform for student code.

## About Zephyr

Zephyr is a grading platform designed for use at UIUC's CS 225 Data Structures course. It is designed as a number of loosely-coupled packages that can be combined and reused in different ways to facilitate grading on a variety of platforms:

* By students on their own machines (`@illinois/zephyr-student-cli`)
* By staff, for one or many students at once (`@illinois/zephyr-staff-cli`)
* During nightly grading runs on Broadway, our upcoming distributed grader (coming soon)
* On PrairieLearn (coming soon)
* On Coursera (coming soon)

By sharing code between all these platforms, Zephyr aims to ensure consistent grading no matter where the code is being graded or who is running the grading.

## Architecture

### Grader

The heart of Zephyr is `@illinois/zephyr-catch-grader`. This package is designed to compile and execute our test suites, which are written using [Catch2](https://github.com/catchorg/Catch2), an open-source C++ testing framework. It handles a variety of common tasks:

* Compiling test suites against student code
* Determining which tests exist
* Executing each test in isolation
* Parsing Catch's output
* Handling timeouts, excessive output, and other errors
* Reporting results in a format that can be consumed by other packages

The grader is deliberately designed to be an independent unit with a simple interface. This provides a number of advantages:

* Allows us to ensure consistent behavior on every supported platform
* Allows for the possibility of graders for other languages, since code for each supported platform doesn't need to make assumptions about how the grading is actually being done

### CLIs

There are two CLIs available for grading code. One is meant for students (`@illinois/zephyr-student-cli`) and one is meant for course staff (`@illinois/zephyr-staff-cli`).

#### `@illinois/zephyr-student-cli`

```sh
# Install the cli
npm i -g @illinois/zephyr-student-cli
# From within any assignment directory, run...
zephyr
```

The student CLI functions as a thin wrapper around the usual testing process that students are used to (`make test && test`). However, it will more closely mimic the way that code is graded for nightly/final grading runs:

* Timeouts and excessive output are reported
* Points are tallied to report a score
* Tests that are tagged with `[valgrind]` are actually executed with Valgrind

The Zephyr student CLI is not meant to replace the need to manually run the Catch tests - that will still be necessary for things like debugging or examining output, for instance. It's meant as more of a final check for how your code will be executed during final grading.

#### `@illinois/zephyr-staff-cli`

```sh
# Install the cli
npm i -g @illinois/zephyr-staff-cli
# From within any assignment directory, run...
zephyr-staff --help
```

The staff CLI is a much more full-featured application. It has the following capabilities:

* Fetch the course assignment files (config, tests, etc)
* Fetch student files, optionally based on a deadline timestamp
* Grade each student's code
* Collect files for export
* Process results into student reports and a gradebook CSV

#### Other platforms

As mentioned above, Zephyr will support more grading platforms in the future.

PrairieLearn grades code inside a Docker container. It will be esay to build a light wrapper around the core grader that moves files around and provides the correct directory to the grader, and then writes the results in the format that PrairieLearn expects.

Broadway, our upcoming department-wide grading job execution platform, will also grade code inside of containers. Much, if not all, of the code from PrairieLearn will be able to be reused here, including the base Docker image.