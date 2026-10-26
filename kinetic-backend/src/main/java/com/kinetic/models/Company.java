package com.kinetic.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Rede de empresas (parentId nulo, do usuário DONO) ou filial dela (parentId = rede,
 * com a conta EMPRESA que entra por usuário rede.filial). Toda empresa tem CNPJ próprio.
 */
@Entity
@Table(name = "companies")
@Getter
@Setter
@NoArgsConstructor
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String nome;

    @Column(unique = true)
    private String cnpj;

    /** Rede a que a filial pertence; nulo na própria rede. */
    @Column(name = "parent_id")
    private UUID parentId;

    /** Prefixo do usuário (na rede) ou sufixo (na filial): rede.filial. */
    @Column(length = 40)
    private String slug;

    @Column(name = "responsible_name")
    private String responsibleName;

    /** E-mail real do responsável: recebe as credenciais. Pode repetir entre filiais. */
    @Column(name = "contact_email", length = 254)
    private String contactEmail;

    @Column(length = 500)
    private String address;

    @Column(length = 20)
    private String phone;

    @Column(nullable = false)
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
