#! /bin/bash

##### SETUP #####
echo "Setting up..."

JOB_DIR='/grade/'
STUDENT_DIR=$JOB_DIR'student/'
SERVER_FILES_COURSE_DIR=$JOB_DIR'serverFilesCourse/'
TEST_DIR=$JOB_DIR'tests/'

# Student files, test files, and serverFilesCourse files will be merged into this directory
AG_DIR=$JOB_DIR'run/'
# Results should end up in this directory
RESULTS_DIR=$JOB_DIR'results/'

mkdir $AG_DIR
mkdir $RESULTS_DIR

# Copy tests and student code into the run directory
cp -av $TEST_DIR. $AG_DIR
cp -rv $STUDENT_DIR. $AG_DIR

# Copy the grader script and catch header into the run directory
cp -v $SERVER_FILES_COURSE_DIR'catch/catch.hpp' $AG_DIR
cp -v $SERVER_FILES_COURSE_DIR'catch/grader.py' $AG_DIR

# give the ag user ownership of the run folder
/usr/bin/sudo chown ag $AG_DIR
/usr/bin/sudo chmod -R +rw $AG_DIR


##### EXECUTION #####
echo "Starting grading..."

cd $AG_DIR

# run the autograder as non-root
# THIS IS IMPORTANT
# we do the capturing ourselves, so that only the stdout of the autograder is used and that we aren't relying on any files that the student code could easily create
# we are also running the autograder as a limited user called ag
/usr/bin/sudo -H -u ag bash -c 'node /app/packages/zephyr-catch-prairielearn-grader/lib/index.js' > results.json

# get the results from the file
cp $AG_DIR'results.json' $RESULTS_DIR'results.json'

echo "Grading complete!"