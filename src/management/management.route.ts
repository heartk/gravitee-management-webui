/*
 * Copyright (C) 2015 The Gravitee team (http://gravitee.io)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import InstancesService from '../services/instances.service';
import AuditService from '../services/audit.service';
import ApiService from '../services/api.service';
import ApplicationService from '../services/application.service';
import { User } from '../entities/user';
import RoleService from '../services/role.service';
import DashboardService from '../services/dashboard.service';
import { StateParams } from '@uirouter/core';
import AnalyticsService from '../services/analytics.service';
import TicketsListController from './support/tickets-list.controller';
import TicketService from '../services/ticket.service';

function managementRouterConfig($stateProvider) {
  'ngInject';
  $stateProvider
    .state('management', {
      redirectTo: 'management.apis.list',
      parent: 'withSidenav',
      controller: function ($rootScope, Constants) {
        $rootScope.portalTitle = Constants.org.settings.management.title;
      }
    })
    .state('management.instances', {
      abstract: true,
      url: '/instances',
      template: '<div ui-view></div>'
    })
    .state('management.instances.list', {
      url: '/',
      component: 'instances',
      resolve: {
        instances: (InstancesService: InstancesService) => InstancesService.search().then(response => response.data)
      },
      data: {
        menu: {
          label: 'Gateways',
          icon: 'developer_dashboard',
          firstLevel: true,
          order: 30
        },
        perms: {
          only: ['environment-instance-r']
        },
        docs: {
          page: 'management-gateways'
        }
      }
    })
    .state('management.instances.detail', {
      abstract: true,
      url: '/:instanceId',
      component: 'instance',
      resolve: {
        instance: ($stateParams, InstancesService: InstancesService) =>
          InstancesService.get($stateParams.instanceId).then(response => response.data)
      }
    })
    .state('management.instances.detail.environment', {
      url: '/environment',
      component: 'instanceEnvironment',
      data: {
        menu: {
          label: 'Environment',
          icon: 'computer'
        },
        docs: {
          page: 'management-gateway-environment'
        }
      }
    })
    .state('management.instances.detail.monitoring', {
      url: '/monitoring',
      component: 'instanceMonitoring',
      data: {
        menu: {
          label: 'Monitoring',
          icon: 'graphic_eq'
        },
        docs: {
          page: 'management-gateway-monitoring'
        }
      },
      resolve: {
        monitoringData: ($stateParams, InstancesService: InstancesService, instance: any) =>
          InstancesService.getMonitoringData($stateParams.instanceId, instance.id).then(response => response.data)
      }
    })
    .state('management.platform', {
      url: '/platform?from&to&q&dashboard',
      template: require('./platform/dashboard/dashboard.html'),
      controller: 'DashboardController',
      controllerAs: 'dashboardCtrl',
      resolve: {
        dashboards: (DashboardService: DashboardService) => DashboardService.list('PLATFORM').then(response => response.data)
      },
      data: {
        menu: {
          label: 'Dashboard',
          icon: 'show_chart',
          firstLevel: true,
          order: 40
        },
        perms: {
          only: ['environment-platform-r']
        },
        docs: {
          page: 'management-dashboard'
        }
      },
      params: {
        from: {
          type: 'int',
          dynamic: true
        },
        to: {
          type: 'int',
          dynamic: true
        },
        q: {
          type: 'string',
          dynamic: true
        },
        dashboard: {
          type: 'string',
          dynamic: true
        }
      }
    })
    .state('management.logs', {
      url: '/logs?from&to&q&page&size',
      component: 'platformLogs',
      data: {
        menu: null,
        devMode: true,
        perms: {
          only: ['environment-platform-r']
        },
        docs: {
          page: 'management-api-logs'
        }
      },
      params: {
        from: {
          type: 'int',
          dynamic: true
        },
        to: {
          type: 'int',
          dynamic: true
        },
        q: {
          type: 'string',
          dynamic: true
        },
        page: {
          type: 'int',
          dynamic: true
        },
        size: {
          type: 'int',
          dynamic: true
        }
      },
      resolve: {
        apis: ($stateParams: StateParams, ApiService: ApiService) => ApiService.list(),
        applications: ($stateParams: StateParams, ApplicationService: ApplicationService) => ApplicationService.list()
      }
    })
    .state('management.log', {
      url: '/logs/:logId?timestamp&from&to&q&page&size',
      component: 'platformLog',
      resolve: {
        log: ($stateParams, AnalyticsService: AnalyticsService) =>
          AnalyticsService.getLog($stateParams.logId, $stateParams.timestamp).then(response => response.data)
      },
      data: {
        devMode: true,
        menu: null,
        perms: {
          only: ['environment-platform-r']
        },
        docs: {
          page: 'management-api-log'
        }
      }
    })
    .state('management.audit', {
      url: '/audit',
      template: require('./audit/audit.html'),
      controller: 'AuditController',
      controllerAs: 'auditCtrl',
      data: {
        menu: {
          label: 'Audit',
          icon: 'visibility',
          firstLevel: true,
          order: 50
        },
        perms: {
          only: ['environment-audit-r']
        },
        docs: {
          page: 'management-audit'
        }
      },
      resolve: {
        resolvedApis:
          (ApiService: ApiService) => ApiService.list().then(response => response.data),
        resolvedApplications:
          (ApplicationService: ApplicationService) => ApplicationService.list().then(response => response.data),
        resolvedEvents:
          (AuditService: AuditService) => AuditService.listEvents().then(response => response.data)
      }
    })
    .state('management.messages', {
      url: '/messages',
      component: 'messages',
      data: {
        menu: {
          label: 'Messages',
          icon: 'message',
          firstLevel: true,
          order: 50
        },
        perms: {
          only: ['environment-message-c']
        },
        docs: {
          page: 'management-messages'
        }
      },
      resolve: {
        resolvedScope: () => 'ENVIRONMENT',
        resolvedRoles: (RoleService: RoleService) => RoleService.list('ENVIRONMENT')
      }
    })
    .state('management.tasks', {
      url: '/tasks',
      component: 'tasks',
      data: {
        docs: {
          page: 'management-tasks'
        }
      },
      resolve: {
        tasks: ( graviteeUser: User) => {
          return graviteeUser.tasks;
        }
      }
    })
    .state('management.support', {
      template: '<div ui-view></div>',
    })
    .state('management.support.create', {
      url: '/support',
      template: require('./support/ticket.html'),
      controller: 'SupportTicketController',
      controllerAs: 'supportTicketCtrl'
    })
    .state('management.support.tickets', {
      url: '/support/tickets?page&size&order',
      template: require('./support/tickets-list.html'),
      controller: TicketsListController,
      controllerAs: 'ticketsListCtrl',
      params: {
        page: {
          type: 'int',
          dynamic: true
        },
        size: {
          type: 'int',
          dynamic: true
        },
        order: {
          type: 'string',
          dynamic: true
        }
      },
    })
    .state('management.support.ticket', {
      url: '/support/tickets/:ticketId?page&size&order',
      component: 'ticketDetail',
      resolve: {
        ticket: ($stateParams: StateParams, TicketService: TicketService) =>
          TicketService.getTicket($stateParams.ticketId).then(response => response.data)
      }
    })
  ;
}

export default managementRouterConfig;
