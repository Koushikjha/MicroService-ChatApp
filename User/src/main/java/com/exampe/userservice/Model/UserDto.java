package com.exampe.userservice.Model;

import lombok.Data;

@Data
public class UserDto {
    String username;
    String hashedPassword;
}
