#include <iostream>
#include "code.h"

int add_numbers(int a, int b) {
  for (int i = 0; i < 1000000; i++) {
    std::cout << "Hello, world!" << std::endl;
  }
  return a + b;
}
