#include <stdio.h>

#define NUM_JOBS 10
int main()
{
	unsigned int jank[5000];
	unsigned int j = 0;
	unsigned int i;
    unsigned int q;
	#pragma omp parallel for schedule(static,NUM_JOBS)
	for (i = 1; i <= 5000; i++)
	{
        jank[i-1] = i;
	}

	for (i = 0; i < 5000; i++)
	{
        j += jank[i];
	}
	printf("RESULT: %u\n", j);
	return 0;
}
