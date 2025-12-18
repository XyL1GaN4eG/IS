package com.juko.itmo.infsys.service.storage

import com.juko.itmo.infsys.config.MinioProperties
import io.minio.BucketExistsArgs
import io.minio.CopySource
import io.minio.CopyObjectArgs
import io.minio.GetObjectArgs
import io.minio.MakeBucketArgs
import io.minio.MinioClient
import io.minio.PutObjectArgs
import io.minio.RemoveObjectArgs
import org.springframework.stereotype.Service
import java.io.ByteArrayInputStream
import java.io.InputStream
import java.util.UUID
import java.util.concurrent.atomic.AtomicBoolean

data class StagedObject(
    val stagingKey: String,
    val finalKey: String,
    val fileName: String,
    val contentType: String?,
)

@Service
class MinioStorageService(
    private val minioClient: MinioClient,
    private val props: MinioProperties,
) {
    private val bucketReady = AtomicBoolean(false)

    private fun ensureBucketExists() {
        if (bucketReady.get()) return
        synchronized(bucketReady) {
            if (bucketReady.get()) return
            val exists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(props.bucket).build())
            if (!exists) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(props.bucket).build())
            }
            bucketReady.set(true)
        }
    }

    fun stageUpload(bytes: ByteArray, originalFileName: String, contentType: String?): StagedObject {
        ensureBucketExists()
        val safeFileName = sanitizeFileName(originalFileName)
        val txId = UUID.randomUUID().toString()
        val stagingKey = "staging/$txId/$safeFileName"
        val finalKey = "imports/$txId/$safeFileName"

        minioClient.putObject(
            PutObjectArgs.builder()
                .bucket(props.bucket)
                .`object`(stagingKey)
                .stream(ByteArrayInputStream(bytes), bytes.size.toLong(), -1)
                .contentType(contentType)
                .build()
        )

        return StagedObject(
            stagingKey = stagingKey,
            finalKey = finalKey,
            fileName = safeFileName,
            contentType = contentType,
        )
    }

    fun commit(staged: StagedObject) {
        ensureBucketExists()
        try {
            minioClient.copyObject(
                CopyObjectArgs.builder()
                    .bucket(props.bucket)
                    .`object`(staged.finalKey)
                    .source(CopySource.builder().bucket(props.bucket).`object`(staged.stagingKey).build())
                    .build()
            )
        } catch (e: Exception) {
            rollback(staged)
            throw e
        }

        try {
            minioClient.removeObject(
                RemoveObjectArgs.builder()
                    .bucket(props.bucket)
                    .`object`(staged.stagingKey)
                    .build()
            )
        } catch (e: Exception) {
            rollback(staged)
            throw e
        }
    }

    fun rollback(staged: StagedObject) {
        runCatching {
            ensureBucketExists()
            minioClient.removeObject(
                RemoveObjectArgs.builder()
                    .bucket(props.bucket)
                    .`object`(staged.stagingKey)
                    .build()
            )
        }
        runCatching {
            ensureBucketExists()
            minioClient.removeObject(
                RemoveObjectArgs.builder()
                    .bucket(props.bucket)
                    .`object`(staged.finalKey)
                    .build()
            )
        }
    }

    fun getObject(objectKey: String): InputStream {
        ensureBucketExists()
        return minioClient.getObject(
            GetObjectArgs.builder()
                .bucket(props.bucket)
                .`object`(objectKey)
                .build()
        )
    }

    private fun sanitizeFileName(original: String): String {
        val base = original.substringAfterLast('/').substringAfterLast('\\')
        val trimmed = base.ifBlank { "import.yaml" }
        return trimmed.replace(Regex("[^A-Za-z0-9._-]"), "_")
    }
}
