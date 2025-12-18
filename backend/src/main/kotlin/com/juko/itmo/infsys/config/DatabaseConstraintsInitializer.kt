package com.juko.itmo.infsys.config

import org.slf4j.LoggerFactory
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

@Component
class DatabaseConstraintsInitializer(
    private val jdbcTemplate: JdbcTemplate,
) : ApplicationRunner {
    private val logger = LoggerFactory.getLogger(DatabaseConstraintsInitializer::class.java)

    override fun run(args: ApplicationArguments?) {
        tryExecute(
            "alter table location alter column loc_name drop not null;",
            "Drop NOT NULL from location.loc_name"
        )

        tryExecute(
            """
            do $$
            begin
              if not exists (
                select 1
                from pg_constraint
                where conname = 'location_loc_name_not_blank'
              ) then
                alter table location
                  add constraint location_loc_name_not_blank
                  check (loc_name is null or btrim(loc_name) <> '');
              end if;
            end$$;
            """.trimIndent(),
            "Add CHECK location_loc_name_not_blank"
        )

        tryExecute(
            """
            do $$
            begin
              if not exists (
                select 1
                from pg_constraint
                where conname = 'person_height_positive'
              ) then
                alter table person
                  add constraint person_height_positive
                  check (height > 0);
              end if;
            end$$;
            """.trimIndent(),
            "Add CHECK person_height_positive"
        )

        tryExecute(
            """
            do $$
            begin
              if not exists (
                select 1
                from pg_constraint
                where conname = 'person_name_not_blank'
              ) then
                alter table person
                  add constraint person_name_not_blank
                  check (btrim(name) <> '');
              end if;
            end$$;
            """.trimIndent(),
            "Add CHECK person_name_not_blank"
        )
    }

    private fun tryExecute(sql: String, description: String) {
        runCatching { jdbcTemplate.execute(sql) }
            .onFailure { logger.warn("{} skipped: {}", description, it.message) }
    }
}

