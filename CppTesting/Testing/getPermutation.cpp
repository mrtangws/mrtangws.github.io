#include <string>
#include <vector>
#include <iostream>

using namespace std;

class Solution {
public:
	string getPermutation(int n, int k) {
		k -= 1;
		vector<int> fac{ 1 };
		string str;
		string result;
		for (int i = 1; i <= n; ++i)
		{
			fac.push_back(fac[i - 1] * i);
			str += std::to_string(i);
		}
		if (k >= fac[n])
			return "out_of_range";
		for (int i = n - 1; i >= 0; --i)
		{
			int quo = k / fac[i];
			result.append(1, str[quo]);
			str.erase(quo, 1);
			k -= quo * fac[i];
		}
		result.append(str);
		return result;
	}
};

//int main()
//{
//	Solution sol;
//
//	cout << sol.getPermutation(3, 3) << endl;
//	cout << sol.getPermutation(4, 9) << endl;
//	cout << sol.getPermutation(9, 200000) << endl;
//}