package com.exampe.userservice.Controller;

import com.exampe.userservice.Model.User;
import com.exampe.userservice.Model.UserDto;
import com.exampe.userservice.Model.UserResponse;
import com.exampe.userservice.Service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/by-username")
    public ResponseEntity<?> findByUsername(@RequestParam String username){

        User user = userService.findByUsername(username);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User not found"));
        }

        UserResponse response = new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getHashedPassword()
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/saveUser")
    public ResponseEntity<?> saveUser(@RequestBody UserDto userDto){
        if (userService.existsByUsername(userDto.getUsername())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Username already exists");
        }
        User user=new User();
        user.setUsername(userDto.getUsername());
        user.setHashedPassword(userDto.getHashedPassword());
        user.setCreatedAt(LocalDateTime.now());
        userService.saveUser(user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "User created successfully"));
    }

}