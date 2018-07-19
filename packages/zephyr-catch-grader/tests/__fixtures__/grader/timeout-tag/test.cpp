#include "catch.hpp"

#include "code.h"

TEST_CASE("add_numbers correctly adds two numbers", "[timeout=1000]") {
  REQUIRE(add_numbers(1, 2) == 3);
}
