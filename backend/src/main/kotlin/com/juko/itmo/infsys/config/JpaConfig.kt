package com.juko.itmo.infsys.config

import jakarta.persistence.EntityManagerFactory
import org.eclipse.persistence.config.PersistenceUnitProperties
import org.springframework.boot.autoconfigure.domain.EntityScan
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.data.jpa.repository.config.EnableJpaRepositories
import org.springframework.orm.jpa.JpaTransactionManager
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean
import org.springframework.orm.jpa.vendor.EclipseLinkJpaVendorAdapter
import javax.sql.DataSource

@Configuration
@EntityScan("com.juko.itmo.infsys.entity")
@EnableJpaRepositories("com.juko.itmo.infsys.data.repository")
class JpaConfig {

    @Bean
    fun entityManagerFactory(dataSource: DataSource): LocalContainerEntityManagerFactoryBean {
        val vendorAdapter = EclipseLinkJpaVendorAdapter()
        vendorAdapter.setGenerateDdl(true)
        vendorAdapter.setShowSql(true)

        val factory = LocalContainerEntityManagerFactoryBean()
        factory.dataSource = dataSource
        factory.jpaVendorAdapter = vendorAdapter
        factory.setPackagesToScan("com.juko.itmo.infsys.entity")
        factory.setJpaPropertyMap(
            mapOf(
                PersistenceUnitProperties.WEAVING to "static",
                PersistenceUnitProperties.DDL_GENERATION to "create-or-extend-tables",
                PersistenceUnitProperties.LOGGING_LEVEL to "FINE"
            )
        )
        return factory
    }

    @Bean
    fun transactionManager(emf: EntityManagerFactory): JpaTransactionManager {
        return JpaTransactionManager(emf)
    }
}
