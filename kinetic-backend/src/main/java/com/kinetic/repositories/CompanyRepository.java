package com.kinetic.repositories;

import com.kinetic.models.Company;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CompanyRepository extends JpaRepository<Company, UUID> {

    /** Redes (empresas sem parent), da mais recente para a mais antiga. */
    Page<Company> findByParentIdIsNullOrderByCreatedAtDesc(Pageable pageable);

    /** Filiais de uma rede, em ordem alfabética. */
    List<Company> findByParentIdOrderByNomeAsc(UUID parentId);

    /** Filial pelo id, só se for da rede informada. */
    Optional<Company> findByIdAndParentId(UUID id, UUID parentId);

    long countByParentId(UUID parentId);

    boolean existsByCnpj(String cnpj);

    boolean existsByCnpjAndIdNot(String cnpj, UUID id);

    boolean existsBySlugAndParentIdIsNull(String slug);

    boolean existsByParentIdAndSlug(UUID parentId, String slug);
}
