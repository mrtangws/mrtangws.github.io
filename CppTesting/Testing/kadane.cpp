#include <climits>
#include <iostream>
#include <vector>

using namespace std;

//template<class T> T max(const T& a, const T& b)
//{
//    return (a > b) ? a : b;
//}

int maxSubArraySum(int a[], int size)
{
    int max_so_far = INT_MIN, max_ending_here = 0;

    for (int i = 0; i < size; i++) {
        max_ending_here += a[i];
        max_so_far = max(max_so_far, max_ending_here);

        max_ending_here = max(max_ending_here, 0);
    }
    return max_so_far;
}

int largestRectangleArea(vector<int>& heights)
{
    int size = heights.size();
    int max_so_far = INT_MIN, max_ending_here = 0;

    for (int i = 0; i < size; i++) {
        max_ending_here += heights[i];
        max_so_far = std::max(max_so_far, max_ending_here);

        max_ending_here = std::max(max_ending_here, 0);
    }
    return max_so_far;
}

int main()
{
    int a[] = { -2, -3, 4, -1, -2, 1, 5, -3 };
    int n = sizeof(a) / sizeof(a[0]);

    // Function Call
    int max_sum = maxSubArraySum(a, n);
    std::cout << "Maximum contiguous sum is " << max_sum;



    return 0;
}