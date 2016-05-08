#include <stdio.h>

#define NUM_JOBS 10
int main()
{
    unsigned int j = 0;
    unsigned int i;
    unsigned int q;
    #pragma omp parallel for private(i,q) schedule(static,10) reduction(+:j)
    for (i = 1; i <= 20; i++)
    {
        int acc=0;
        for (q = 0; q < i*i; q++)
            if (q % 2)
                acc += 2*q;
            else
                acc -= q;
        j += acc;
    }
    printf("RESULT: %u\n", j);
    return 0;
}
