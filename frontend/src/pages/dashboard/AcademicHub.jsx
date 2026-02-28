import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Scale, ArrowRight, Star, BookOpen, GraduationCap as CapIcon } from 'lucide-react';
import { Card, Button } from '../../components/ui';

const AcademicHub = () => {
    const navigate = useNavigate();

    const tools = [
        {
            title: "Simulador OAB",
            description: "Treine para o exame da ordem com nossa IA especializada. Avaliação de peças e questões.",
            icon: Scale,
            href: "/dashboard/oab-simulator",
            color: "blue"
        },
        {
            title: "Assistente TCC",
            description: "Orientação especializada para seu trabalho de conclusão de curso em Direito. Da estrutura ao conteúdo.",
            icon: GraduationCap,
            href: "/dashboard/tcc-assistant",
            color: "indigo"
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <CapIcon className="w-8 h-8 text-accent" />
                        Área Acadêmica
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Ferramentas de apoio para estudantes e profissionais em constante atualização.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tools.map((tool) => (
                    <Card key={tool.title} className="group hover:border-accent/40 transition-all duration-300">
                        <div className="p-8 flex flex-col h-full">
                            <div className={`w-14 h-14 rounded-2xl bg-${tool.color}-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                <tool.icon className={`w-8 h-8 text-${tool.color}-500`} />
                            </div>
                            
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{tool.title}</h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-8 flex-1">
                                {tool.description}
                            </p>

                            <Button 
                                onClick={() => navigate(tool.href)}
                                className="w-full flex items-center justify-center gap-2 group-hover:gap-4 transition-all"
                            >
                                Acessar Ferramenta
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            <Card className="bg-gradient-to-br from-accent/5 to-transparent border-accent/20">
                <div className="p-8 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                        <Star className="w-8 h-8 text-accent animate-pulse" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Dica JusCore</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                            Utilize o Simulador OAB para manter-se atualizado com as últimas tendências e teses, mesmo já sendo um profissional estabelecido.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default AcademicHub;
