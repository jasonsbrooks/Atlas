#include <stdio.h>

#define NUM_JOBS 5
int main()
{
	unsigned int jank[50];
	unsigned int j = 0;
	unsigned int i;
    unsigned int q;
	#pragma omp parallel for schedule(static,NUM_JOBS)
	for (i = 1; i <= 50; i++)
	{
        int z=0;
        for (q = 0; q<i*i; q++)
          z+=q;
        jank[i-1] = z;
	}

	for (i = 0; i < 50; i++)
	{
        j += jank[i];
        printf("jank[%d]:%d\n",i,jank[i]);
	}
	printf("RESULT: %u\n", j);
	return 0;
}
