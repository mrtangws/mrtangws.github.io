//#include <iostream>
//#include <functional>
//#include <unordered_map>
//
//template<typename Sig, typename F = Sig* >
//struct memoize_t;
//template<typename R, typename Arg, typename F>
//struct memoize_t<R(Arg), F> {
//    F f;
//    mutable std::unordered_map< Arg, R > results;
//    template<typename... Args>
//    R operator()(Args&&... args) const {
//        Arg a{ std::forward<Args>(args)... }; // in tuple version, std::tuple<...> a
//        auto it = results.find(a);
//        if (it != results.end())
//            return it->second;
//        R retval = f(a); // in tuple version, use a tuple-to-arg invoker
//        results.emplace(std::forward<Arg>(a), retval); // not sure what to do here in tuple version
//        return retval;
//    }
//};
//
//template<typename F>
//memoize_t<F> memoize(F* func) {
//    return { func };
//}
//
//#define CAT2(A,B,C) A##B##C
//#define CAT(A,B,C) CAT2(A,B,C)
//#define MEMOIZE(F) \
//  static auto CAT( memoize_static_, __LINE__, F ) = memoize(F); \
//  auto&& F = CAT( memoize_static_, __LINE__, F )

// --- Fibonacci Problem --- //
//int fib(int n) {
//    //static auto mem = memoize(fib);
//    //auto&& fib = mem;
//    MEMOIZE(fib);
//    std::cout << "fib " << n << "...\n";
//    if (n <= 1) return n;
//    return fib(n - 1) + fib(n - 2);;
//}
//int main() {
//    std::cout << fib(10) << "\n";
//}

// --- LCS Problem --- //
//int max(int a, int b)
//{
//    return (a > b) ? a : b;
//}
//int lcs(char* X, char* Y, int m, int n) // Returns length of LCS for X[0..m-1], Y[0..n-1]
//{
//    MEMOIZE(lcs);
//    std::cout << "lcs " << m << n << "...\n";
//    if (m == 0 || n == 0)
//        return 0;
//    if (X[m - 1] == Y[n - 1])
//        return 1 + lcs(X, Y, m - 1, n - 1);
//    else
//        return max(lcs(X, Y, m, n - 1),
//            lcs(X, Y, m - 1, n));
//}
//int main()
//{
//    char X[] = "AGGTAB";
//    char Y[] = "GXTXAYB";
//
//    int m = strlen(X);
//    int n = strlen(Y);
//
//    printf("Length of LCS is %d\n", lcs(X, Y, m, n));
//
//    return 0;
//}
#include <iostream>
#include <map>
#include <tuple>
#define MEMOIZATOR(N, R, ...)                               \
R _ ## N (__VA_ARGS__);                                     \
std::map<std::tuple<__VA_ARGS__>, R> _memo_ ## N;           \
template <typename ... Args>                                \
R N (Args ... args) {                                       \
    auto& _memo = _memo_ ## N;                              \
    auto result = _memo.find(std::make_tuple(args...));     \
    if (result != _memo.end()) {                            \
        return result->second;                              \
    }                                                       \
    else {                                                  \
        auto result = _ ## N  (args...);                    \
        _memo[std::make_tuple(args...)] = result;           \
        return result;                                      \
    }                                                       \
}

MEMOIZATOR(fibonacci, long int, int);

long int _fibonacci(int n) { // note the leading underscore 
    // this makes recursive function to go through wrapper
    std::cout << "fib " << n << std::endl;
    if (n <= 1) {
        return n;
    }
    return fibonacci(n - 2) + fibonacci(n - 1);
}

char X[] = "AGGTAB";
char Y[] = "GXTXAYB";

// --- LCS Problem --- //
MEMOIZATOR(lcs, int, int, int);
int max(int a, int b)
{
    return (a > b) ? a : b;
}
int _lcs(int m, int n) // Returns length of LCS for X[0..m-1], Y[0..n-1]
{
    std::cout << "lcs " << m << " " << n << std::endl;
    if (m == 0 || n == 0)
        return 0;
    if (X[m - 1] == Y[n - 1])
        return 1 + lcs(m - 1, n - 1);
    else
        return max(lcs(m, n - 1), lcs(m - 1, n));
}

//int main()
//{
//    //std::cout << fibonacci(40) << std::endl; // uses memoizator so it works in linear time 
//    std::cout << lcs(strlen(X), strlen(Y)) << std::endl;
//        // (try it with and without memoizator)
//}