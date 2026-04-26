package com.exampe.userservice.Service;

import com.exampe.userservice.Dao.UserDao;
import com.exampe.userservice.Model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserDao userdao;
    public User findByUsername(String username){
        return userdao.findByUsername(username).orElse(null);
    }
    public void saveUser(User user){
        userdao.save(user);
    }

    public boolean existsByUsername(String username) {
        User user=userdao.findByUsername(username).orElse(null);
        if(user==null){
            return false;
        }
        return true;
    }
}
