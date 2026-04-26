package com.example.authservice.Feign;

import com.example.authservice.Model.UserDto;
import com.example.authservice.Model.UserResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@FeignClient("user-service")
public interface AuthInterface {
    @GetMapping("/users/by-username")
    public UserResponse findByUsername(@RequestParam String username);
    @PostMapping("/users/saveUser")
    public ResponseEntity<?> saveUser(@RequestBody UserDto userDto);
}
