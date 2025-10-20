package httpx

import "net/http"

func CloneHeaders(src http.Header) http.Header {
	dst := make(http.Header, len(src))
	for k, v := range src {
		vs := make([]string, len(v))
		copy(vs, v)
		dst[k] = vs
	}
	return dst
}
