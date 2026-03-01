package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"os"

	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load(".env")
	// Fetch some items to see if there are other statuses already used
	url := os.Getenv("SUPABASE_URL") + "/rest/v1/warung_cart_items?select=status&limit=50"
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Add("apikey", os.Getenv("SUPABASE_SERVICE_KEY"))
	req.Header.Add("Authorization", "Bearer "+os.Getenv("SUPABASE_SERVICE_KEY"))

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
	body, _ := ioutil.ReadAll(res.Body)
	fmt.Println(string(body))
}
