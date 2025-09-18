package main

import "manage-project/router"

func main() {
	router := router.SetupRouter()
	err := router.Run(":8092")
	if err != nil {
		panic(err)
	}
}
