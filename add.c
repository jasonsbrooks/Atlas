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
        int acc=0;
        for (q = 0; q < i*i; q++)
            if (q % 2)
                acc += 2*q;
            else
                acc -= q;
        jank[i-1] = acc;
	}

	for (i = 0; i < 5000; i++)
	{
        j += jank[i];
	}
	printf("RESULT: %u\n", j);
	return 0;
}
