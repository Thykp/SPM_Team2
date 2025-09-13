package main

import (
    "manage-account/routers"
)

func main() {
    r := routers.SetupRouter()

    if err := r.Run(":8090"); err != nil {
        panic(err)
    }
}
