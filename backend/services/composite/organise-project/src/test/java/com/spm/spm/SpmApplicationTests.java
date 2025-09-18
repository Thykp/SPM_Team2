package com.spm.spm;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(
		classes = SpmApplication.class,
		webEnvironment = SpringBootTest.WebEnvironment.NONE
)
@ActiveProfiles("test")
class SpmApplicationTests {
	@Test void contextLoads() {}
}
