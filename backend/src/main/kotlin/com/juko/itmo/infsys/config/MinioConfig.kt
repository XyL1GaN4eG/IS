package com.juko.itmo.infsys.config

import io.minio.MinioClient
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@ConfigurationProperties(prefix = "minio")
data class MinioProperties(
    val endpoint: String,
    val accessKey: String,
    val secretKey: String,
    val bucket: String,
)

@Configuration
@EnableConfigurationProperties(MinioProperties::class)
class MinioConfig {
    @Bean
    fun minioClient(props: MinioProperties): MinioClient =
        MinioClient.builder()
            .endpoint(props.endpoint)
            .credentials(props.accessKey, props.secretKey)
            .build()
}

