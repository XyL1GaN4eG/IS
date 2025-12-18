package com.juko.itmo.infsys.config

import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

@Component
class DatabaseFunctionsInitializer(
    private val jdbcTemplate: JdbcTemplate,
) : ApplicationRunner {
    override fun run(args: ApplicationArguments?) {
        jdbcTemplate.execute(
            """
            create or replace function person_delete_by_height(p_height double precision)
            returns integer
            language plpgsql
            as $$
            declare
              deleted_count integer;
            begin
              delete from person where height = p_height;
              get diagnostics deleted_count = row_count;
              return deleted_count;
            end;
            $$;
            """.trimIndent()
        )

        jdbcTemplate.execute(
            """
            create or replace function person_max_id()
            returns bigint
            language sql
            as $$
              select max(id) from person;
            $$;
            """.trimIndent()
        )

        jdbcTemplate.execute(
            """
            create or replace function person_unique_heights()
            returns table(height double precision)
            language sql
            as $$
              select distinct p.height
              from person p
              order by p.height;
            $$;
            """.trimIndent()
        )

        jdbcTemplate.execute(
            """
            create or replace function person_count_by_eye_color(p_eye_color text)
            returns bigint
            language sql
            as $$
              select count(*) from person p where p.eye_color = p_eye_color;
            $$;
            """.trimIndent()
        )

        jdbcTemplate.execute(
            """
            create or replace function person_share_by_eye_color(p_eye_color text)
            returns double precision
            language sql
            as $$
              select
                case when count(*) = 0 then 0::double precision
                     else (sum(case when p.eye_color = p_eye_color then 1 else 0 end)::double precision * 100.0)
                          / count(*)::double precision
                end
              from person p;
            $$;
            """.trimIndent()
        )
    }
}

