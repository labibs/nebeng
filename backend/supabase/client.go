package supabase

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/nebeng/backend/config"
)

// Client is a simple Supabase REST client using the service role key
type Client struct {
	baseURL    string
	serviceKey string
	httpClient *http.Client
}

var DefaultClient *Client

func Init() {
	DefaultClient = &Client{
		baseURL:    config.Cfg.SupabaseURL,
		serviceKey: config.Cfg.SupabaseServiceKey,
		httpClient: &http.Client{},
	}
}

// QueryParams represents query string parameters for Supabase REST API
type QueryParams struct {
	Select  string
	Filters []string // e.g. ["user_id=eq.abc", "status=eq.pending"]
	Order   string   // e.g. "created_at.desc"
	Limit   int
	Offset  int
}

// From performs a SELECT query on the given table
func (c *Client) From(table string) *RequestBuilder {
	return &RequestBuilder{
		client: c,
		table:  table,
		method: "GET",
	}
}

type RequestBuilder struct {
	client  *Client
	table   string
	method  string
	filters []string
	select_ string
	order   string
	limit   int
	body    interface{}
}

func (rb *RequestBuilder) Select(cols string) *RequestBuilder {
	rb.select_ = cols
	return rb
}

func (rb *RequestBuilder) Filter(filter string) *RequestBuilder {
	rb.filters = append(rb.filters, filter)
	return rb
}

func (rb *RequestBuilder) Order(order string) *RequestBuilder {
	rb.order = order
	return rb
}

func (rb *RequestBuilder) Limit(n int) *RequestBuilder {
	rb.limit = n
	return rb
}

func (rb *RequestBuilder) Execute() ([]byte, error) {
	url := fmt.Sprintf("%s/rest/v1/%s", rb.client.baseURL, rb.table)

	// Build query params
	params := ""
	if rb.select_ != "" {
		params += "?select=" + rb.select_
	}
	for i, f := range rb.filters {
		if i == 0 && params == "" {
			params += "?" + f
		} else {
			params += "&" + f
		}
	}
	if rb.order != "" {
		sep := "&"
		if params == "" {
			sep = "?"
		}
		params += sep + "order=" + rb.order
	}
	if rb.limit > 0 {
		sep := "&"
		if params == "" {
			sep = "?"
		}
		params += fmt.Sprintf("%slimit=%d", sep, rb.limit)
	}

	url += params

	var bodyReader io.Reader
	if rb.body != nil {
		b, err := json.Marshal(rb.body)
		if err != nil {
			return nil, err
		}
		bodyReader = bytes.NewReader(b)
	}

	req, err := http.NewRequest(rb.method, url, bodyReader)
	if err != nil {
		return nil, err
	}

	req.Header.Set("apikey", rb.client.serviceKey)
	req.Header.Set("Authorization", "Bearer "+rb.client.serviceKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Prefer", "return=representation")

	resp, err := rb.client.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("supabase error %d: %s", resp.StatusCode, string(respBody))
	}

	return respBody, nil
}

// DoRequest performs a raw HTTP request to Supabase REST API
func (c *Client) DoRequest(method, path string, body interface{}) ([]byte, int, error) {
	url := fmt.Sprintf("%s/rest/v1/%s", c.baseURL, path)

	var bodyReader io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return nil, 0, err
		}
		bodyReader = bytes.NewReader(b)
	}

	req, err := http.NewRequest(method, url, bodyReader)
	if err != nil {
		return nil, 0, err
	}

	req.Header.Set("apikey", c.serviceKey)
	req.Header.Set("Authorization", "Bearer "+c.serviceKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Prefer", "return=representation")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, resp.StatusCode, err
	}

	return respBody, resp.StatusCode, nil
}

// InvokeFunction calls a Supabase Edge Function
func (c *Client) InvokeFunction(functionName string, body interface{}) ([]byte, error) {
	url := fmt.Sprintf("%s/functions/v1/%s", c.baseURL, functionName)

	var bodyReader io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		bodyReader = bytes.NewReader(b)
	}

	req, err := http.NewRequest("POST", url, bodyReader)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+c.serviceKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("function error %d: %s", resp.StatusCode, string(respBody))
	}

	return respBody, nil
}
