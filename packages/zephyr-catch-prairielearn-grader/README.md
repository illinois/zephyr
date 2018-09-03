# zephyr-catch-prairielearn-grader

This "package" is a simple wrapper around `@illinois/zephyr-catch-grader` that is bundled into a Docker image containing all the dependencies we need for grading in PrairieLearn.

## Building the image

Run `npm run build:docker` in this directory. This will build and tag the image as `illinois/zephyr-catch-prairielearn-grader`. You can then manually publish the image as you normally would a Docker image.

