EXENAME = test
OBJS = catchmain.o code.o test.o

CXX = clang++
CXXFLAGS = $(CS225) -std=c++1y -stdlib=libc++ -c -g -O0 -Wall -Wextra -pedantic
LD = clang++
LDFLAGS = -std=c++1y -stdlib=libc++ -lpthread -lm

all : $(EXENAME)

$(EXENAME) : $(OBJS)
	$(LD) $(OBJS) $(LDFLAGS) -o $(EXENAME)

code.o: code.h code.cpp
	$(CXX) $(CXXFLAGS) code.cpp

catchmain.o : catchmain.cpp catch.hpp
	$(CXX) $(CXXFLAGS) catchmain.cpp

test.o : test.cpp code.h code.cpp
	$(CXX) $(CXXFLAGS) test.cpp

clean :
	-rm -f *.o $(EXENAME)
