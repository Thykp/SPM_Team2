package main

import (
	"manage-task/routers"
)

func main() {
	r := routers.SetUpRouter()
	err := r.Run(":8091")
	if err != nil {
		panic(err)
	}
}
