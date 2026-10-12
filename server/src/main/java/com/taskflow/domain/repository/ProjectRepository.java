package com.taskflow.domain.repository;

import com.taskflow.domain.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    @Query("SELECT p FROM Project p ORDER BY p.position ASC, p.createdAt ASC")
    List<Project> findAllOrdered();

    @Query("SELECT p FROM Project p WHERE p.topicId = :topicId ORDER BY p.position ASC, p.createdAt ASC")
    List<Project> findByTopicIdOrdered(@Param("topicId") Long topicId);

    @Query("SELECT p FROM Project p WHERE p.status = :status ORDER BY p.position ASC, p.createdAt ASC")
    List<Project> findByStatusOrdered(@Param("status") String status);
}
