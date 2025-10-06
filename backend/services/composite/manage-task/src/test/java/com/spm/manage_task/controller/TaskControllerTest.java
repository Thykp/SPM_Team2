/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/UnitTests/JUnit4TestClass.java to edit this template
 */

package com.spm.manage_task.controller;

// Make sure its Junit 5

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
public class TaskControllerTest {

    @Autowired
    private MockMvc mvc;

    // SPG 62
    @Test
    void testGetAllTasks() throws Exception{
        MvcResult res = mvc.perform(get("/api/task"))
            .andExpect(status().isOk())
            .andExpect(content().contentType("application/json"))
            .andExpect(content().encoding("UTF-8"))
            .andExpect(jsonPath("$").isArray())
            .andReturn();
        
        System.out.println("Response Body: " + res.getResponse().getContentAsString());
    }

    // SPG 62
    @Test
    void testGetUserTasks() throws Exception{
        String userId = "5ad17add-da44-43ec-b78f-da22451a827b";
        MvcResult res = mvc.perform(get("/api/task/"+userId))
            .andExpect(status().isOk())
            .andExpect(content().contentType("application/json"))
            .andExpect(content().encoding("UTF-8"))
            .andExpect(jsonPath("$").isArray())
            .andReturn();

        System.out.println("Response Body: " + res.getResponse().getContentAsString());
    }
    
    // SPG 92
    // @Test
    // void testCreateTask() throws Exception{
    //     TaskPostRequestDto testInsertObj = new TaskPostRequestDto(
    //         "User Sample Task", 
    //         "2025-09-21 10:36:35+00", 
    //         "This task is used for automated testing of the POST /api/new endpoint for Manage Task Microservice", 
    //         "Overdue", 
    //         null, 
    //         "5ad17add-da44-43ec-b78f-da22451a827b", 
    //         null);
    //     ObjectWriter ow = new ObjectMapper().writer().withDefaultPrettyPrinter();
    //     String convertedJSON = ow.writeValueAsString(testInsertObj);

    //     MvcResult res = mvc.perform(post("/api/task/new")
    //         .contentType(MediaType.APPLICATION_JSON)
    //         .content(convertedJSON))
    //             .andExpect(status().isCreated())
    //             .andExpect(content().contentType("application/json"))
    //             .andReturn();

    //     System.out.println("Response Body: " + res.getResponse().getContentAsString());
    // }
    

}